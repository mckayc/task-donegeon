const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const http = require('http');
const Primus = require('primus');
const { GoogleGenAI } = require('@google/genai');
const sqlite3 = require('sqlite3').verbose();

// === GITHUB IMAGE PACK CONFIG ===
const GITHUB_REPO = 'mckayc/task-donegeon';
const GITHUB_PACKS_PATH = 'image_packs';

// === IN-MEMORY MIGRATIONS ===
const MIGRATION_SCRIPTS = {
    '001_initial_schema.sql': `
-- Version 1: Initial Schema
CREATE TABLE IF NOT EXISTS data (
    id INTEGER PRIMARY KEY,
    json TEXT NOT NULL
);
INSERT OR IGNORE INTO data (id, json) VALUES (1, '{}');
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL
);
INSERT OR IGNORE INTO schema_version (version) VALUES (1);
`
};

// === INLINED DATA HELPERS ===
const { createInitialData, INITIAL_SETTINGS, INITIAL_THEMES, Role, RewardCategory, QuestCompletionStatus, QuestType, QuestAvailability } = require('./data.js');

// Helper to fetch from GitHub API
async function fetchGitHub(apiPath) {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${apiPath}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[GITHUB] GitHub API request failed for ${url}: ${response.statusText}`, errorBody);
        throw new Error(`GitHub API request failed: ${response.statusText}`);
    }
    return response.json();
}

// === MIGRATION LOGIC ===
const runMigrations = (db) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'", (err, row) => {
            if (err) return reject(new Error(`Failed to check for schema_version table: ${err.message}`));
            if (!row) {
                console.log("Schema versioning not found. Bootstrapping database...");
                bootstrapDatabase(db).then(resolve).catch(reject);
            } else {
                executeMigrations(db).then(resolve).catch(reject);
            }
        });
    });
};

const bootstrapDatabase = (db) => {
    return new Promise(async (resolve, reject) => {
        try {
            const migrationScript = MIGRATION_SCRIPTS['001_initial_schema.sql'];
            if (!migrationScript) return reject(new Error("Initial migration script is missing."));
            await new Promise((res, rej) => db.exec(migrationScript, err => err ? rej(err) : res()));
            console.log("Database successfully bootstrapped to version 1.");
            resolve();
        } catch (bootstrapError) {
            reject(new Error(`Database bootstrapping failed: ${bootstrapError.message}`));
        }
    });
};

const executeMigrations = (db) => {
    return new Promise(async (resolve, reject) => {
        try {
            const versionRow = await new Promise((res, rej) => db.get("SELECT version FROM schema_version", (err, row) => err ? rej(err) : res(row)));
            let currentVersion = versionRow ? versionRow.version : 0;
            const migrationFiles = Object.keys(MIGRATION_SCRIPTS).map(f => ({ version: parseInt(f), filename: f })).filter(mf => mf.version > currentVersion).sort((a, b) => a.version - b.version);
            if (migrationFiles.length === 0) return resolve();
            for (const mf of migrationFiles) {
                const script = MIGRATION_SCRIPTS[mf.filename];
                await new Promise((res, rej) => db.exec(script, err => err ? rej(new Error(`Failed on ${mf.filename}: ${err.message}`)) : res()));
                await new Promise((res, rej) => db.run("UPDATE schema_version SET version = ?", [mf.version], err => err ? rej(err) : res()));
            }
            resolve();
        } catch (migrationError) {
            reject(new Error(`Migration process failed: ${migrationError.message}`));
        }
    });
};


async function main() {
    const app = express();
    const server = http.createServer(app);
    const primus = new Primus(server, { transformer: 'websockets' });
    
    // Ensure dist directory exists for primus.save in local dev
    await fs.mkdir(path.join(__dirname, '../dist'), { recursive: true }).catch(() => {});
    primus.save(__dirname + '/../dist/primus.js');

    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.static(path.join(__dirname, '../dist')));
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    const DB_PATH = path.join(__dirname, 'db');
    const DB_FILE = path.join(DB_PATH, 'data.db');

    await fs.mkdir(DB_PATH, { recursive: true });

    const db = await new Promise((resolve, reject) => {
        const database = new sqlite3.Database(DB_FILE, (err) => {
            if (err) return reject(err);
            console.log('Connected to the SQLite database.');
            resolve(database);
        });
    });

    await runMigrations(db);
    console.log("Database is ready.");

    const readData = () => new Promise((resolve, reject) => {
        db.get('SELECT json FROM data WHERE id = 1', [], (err, row) => {
            if (err) return reject(err);
            const defaultData = {
                users: [], quests: [], questGroups: [], markets: [], rewardTypes: [], questCompletions: [],
                purchaseRequests: [], guilds: [], ranks: [], trophies: [], userTrophies: [],
                adminAdjustments: [], gameAssets: [], systemLogs: [], settings: INITIAL_SETTINGS,
                themes: INITIAL_THEMES, loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: [],
            };
            if (row && row.json && row.json !== '{}') {
                try {
                    const dbData = JSON.parse(row.json);
                    const data = { ...defaultData, ...dbData };
                    if (dbData.settings) data.settings = { ...defaultData.settings, ...dbData.settings };
                    resolve(data);
                } catch (e) {
                    resolve(defaultData);
                }
            } else {
                resolve(defaultData);
            }
        });
    });

    const writeData = (data) => new Promise((resolve, reject) => {
        console.log('[DB] Attempting to write data to database...');
        let jsonData;
        try {
            jsonData = JSON.stringify(data);
        } catch (stringifyError) {
            console.error('[DB] FATAL: Failed to stringify data. This may be due to a circular reference.', stringifyError);
            return reject(stringifyError);
        }

        db.run('REPLACE INTO data (id, json) VALUES (1, ?)', [jsonData], function(err) {
            if (err) {
                console.error('[DB] Write FAILED:', err.message);
                return reject(err);
            }
            console.log(`[DB] Write SUCCEEDED. Rows affected: ${this.changes}`);
            if (this.changes === 0) {
                 console.warn('[DB] WARNING: A write operation resulted in 0 rows changed. The data might not have been modified before saving.');
            }
            resolve();
        });
    });

    const broadcastStateUpdate = async () => {
        try {
            console.log('[BROADCAST] Reading latest data to broadcast...');
            const data = await readData();
            primus.write({ type: 'FULL_STATE_UPDATE', payload: data });
            console.log('[BROADCAST] Full state update sent to all clients.');
        } catch (error) {
            console.error("[BROADCAST] Failed to broadcast state update:", error);
        }
    };

    primus.on('connection', spark => console.log('Client connected via Primus'));
    primus.on('disconnection', spark => console.log('Client disconnected via Primus'));

    app.get('/api/data', async (req, res) => {
        try {
            const data = await readData();
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Failed to read data' });
        }
    });

    app.post('/api/action', async (req, res) => {
        const { type, payload } = req.body;
        console.log(`[ACTION] Received action: ${type}`, payload ? JSON.stringify(payload).substring(0, 200) + '...' : '');
        let result = { success: true };
        try {
            console.log('[ACTION] Reading current state from DB...');
            const originalData = await readData();
            // CRITICAL FIX: Work on a deep copy to prevent any reference issues.
            let data = JSON.parse(JSON.stringify(originalData));
            
            // Helper function to apply rewards/setbacks
            const applyBalanceChange = (user, items, guildId, isSetback = false) => {
                if (!user || !items || items.length === 0) return;
                items.forEach(item => {
                    const rewardDef = data.rewardTypes.find(rt => rt.id === item.rewardTypeId);
                    if (!rewardDef) return;
                    const amount = isSetback ? -item.amount : item.amount;
                    if (guildId) {
                        if (!user.guildBalances[guildId]) user.guildBalances[guildId] = { purse: {}, experience: {} };
                        const balance = user.guildBalances[guildId];
                        if (rewardDef.category === RewardCategory.Currency) balance.purse[item.rewardTypeId] = (balance.purse[item.rewardTypeId] || 0) + amount;
                        else balance.experience[item.rewardTypeId] = (balance.experience[item.rewardTypeId] || 0) + amount;
                    } else {
                        if (!user.personalPurse) user.personalPurse = {};
                        if (!user.personalExperience) user.personalExperience = {};
                        if (rewardDef.category === RewardCategory.Currency) user.personalPurse[item.rewardTypeId] = (user.personalPurse[item.rewardTypeId] || 0) + amount;
                        else user.personalExperience[item.rewardTypeId] = (user.personalExperience[item.rewardTypeId] || 0) + amount;
                    }
                });
            };
            const applyRewards = (user, rewards, guildId) => applyBalanceChange(user, rewards, guildId, false);
            const applySetbacks = (user, setbacks, guildId) => applyBalanceChange(user, setbacks, guildId, true);

            switch(type) {
                // === USER ACTIONS ===
                case 'ADD_USER': {
                    const newId = `user-${Date.now()}`;
                    const newUser = { ...payload, id: newId, personalPurse: {}, personalExperience: {}, guildBalances: {}, avatar: {}, ownedAssetIds: [], ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false };
                    data.users.push(newUser);
                    break;
                }
                case 'UPDATE_USER': {
                    const { userId, updatedData } = payload;
                    const userIndex = data.users.findIndex(u => u.id === userId);
                    if (userIndex > -1) data.users[userIndex] = { ...data.users[userIndex], ...updatedData };
                    break;
                }
                case 'DELETE_USER': {
                    data.users = data.users.filter(u => u.id !== payload.userId);
                    break;
                }

                // === QUEST ACTIONS ===
                case 'ADD_QUEST': {
                    const newId = `quest-${Date.now()}`;
                    data.quests.push({ ...payload, id: newId, claimedByUserIds: [], dismissals: [] });
                    break;
                }
                case 'UPDATE_QUEST': {
                    const questIndex = data.quests.findIndex(q => q.id === payload.id);
                    if (questIndex > -1) data.quests[questIndex] = payload;
                    break;
                }
                case 'DELETE_QUEST': {
                    data.quests = data.quests.filter(q => q.id !== payload.questId);
                    break;
                }
                case 'DELETE_QUESTS': {
                    const idsToDelete = new Set(payload.questIds);
                    data.quests = data.quests.filter(q => !idsToDelete.has(q.id));
                    break;
                }
                case 'CLONE_QUEST': {
                    const questToClone = data.quests.find(q => q.id === payload.questId);
                    if(questToClone) {
                        const newQuest = {...questToClone, id: `quest-${Date.now()}`, title: `${questToClone.title} (Copy)`};
                        data.quests.push(newQuest);
                    }
                    break;
                }
                 case 'DISMISS_QUEST': {
                    const { questId, userId } = payload;
                    const quest = data.quests.find(q => q.id === questId);
                    if (quest) {
                        if (!quest.dismissals) quest.dismissals = [];
                        quest.dismissals.push({ userId, dismissedAt: new Date().toISOString() });
                    }
                    break;
                }
                case 'CLAIM_QUEST': {
                    const { questId, userId } = payload;
                    const quest = data.quests.find(q => q.id === questId);
                    if (quest) {
                        if (!quest.claimedByUserIds) quest.claimedByUserIds = [];
                        if (!quest.claimedByUserIds.includes(userId)) {
                            quest.claimedByUserIds.push(userId);
                        }
                    }
                    break;
                }
                case 'RELEASE_QUEST': {
                    const { questId, userId } = payload;
                    const quest = data.quests.find(q => q.id === questId);
                    if (quest && quest.claimedByUserIds) {
                        quest.claimedByUserIds = quest.claimedByUserIds.filter(id => id !== userId);
                    }
                    break;
                }
                case 'MARK_QUEST_TODO': {
                    const { questId, userId } = payload;
                    const quest = data.quests.find(q => q.id === questId);
                    if (quest) {
                        if (!quest.todoUserIds) quest.todoUserIds = [];
                        if (!quest.todoUserIds.includes(userId)) {
                            quest.todoUserIds.push(userId);
                        }
                    }
                    break;
                }
                case 'UNMARK_QUEST_TODO': {
                    const { questId, userId } = payload;
                    const quest = data.quests.find(q => q.id === questId);
                    if (quest && quest.todoUserIds) {
                        quest.todoUserIds = quest.todoUserIds.filter(id => id !== userId);
                    }
                    break;
                }
                case 'COMPLETE_QUEST': {
                    const { questId, userId, guildId, options } = payload;
                    const quest = data.quests.find(q => q.id === questId);
                    const user = data.users.find(u => u.id === userId);
                    if (!quest || !user) throw new Error("Quest or User not found");

                    const newCompletion = {
                        id: `qc-${Date.now()}`,
                        questId, userId, guildId,
                        completedAt: options?.completionDate || new Date().toISOString(),
                        status: quest.requiresApproval ? QuestCompletionStatus.Pending : QuestCompletionStatus.Approved,
                        note: options?.note || '',
                    };
                    data.questCompletions.push(newCompletion);
                    
                    if (!quest.requiresApproval) {
                        applyRewards(user, quest.rewards, guildId);
                    }
                    break;
                }
                case 'APPROVE_QUEST_COMPLETION': {
                    const completion = data.questCompletions.find(c => c.id === payload.completionId);
                    const user = data.users.find(u => u.id === completion?.userId);
                    if(completion && user) {
                        completion.status = QuestCompletionStatus.Approved;
                        const quest = data.quests.find(q => q.id === completion.questId);
                        if(quest) applyRewards(user, quest.rewards, completion.guildId);
                    }
                    break;
                }
                case 'REJECT_QUEST_COMPLETION': {
                    const completion = data.questCompletions.find(c => c.id === payload.completionId);
                    if(completion) completion.status = QuestCompletionStatus.Rejected;
                    break;
                }
                case 'UPDATE_QUESTS_STATUS': {
                    const { questIds, isActive } = payload;
                    data.quests.forEach(q => {
                        if (questIds.includes(q.id)) {
                            q.isActive = isActive;
                        }
                    });
                    break;
                }
                case 'BULK_UPDATE_QUESTS': {
                    const { questIds, updates } = payload;
                    data.quests.forEach(q => {
                        if (questIds.includes(q.id)) {
                            if (updates.isActive !== undefined) q.isActive = updates.isActive;
                            if (updates.isOptional !== undefined) q.isOptional = updates.isOptional;
                            if (updates.requiresApproval !== undefined) q.requiresApproval = updates.requiresApproval;
                            if (updates.groupId !== undefined) q.groupId = updates.groupId === null ? undefined : updates.groupId;
                            if (updates.addTags) q.tags = [...new Set([...q.tags, ...updates.addTags])];
                            if (updates.removeTags) q.tags = q.tags.filter(t => !updates.removeTags.includes(t));
                            if (updates.assignUsers) q.assignedUserIds = [...new Set([...q.assignedUserIds, ...updates.assignUsers])];
                            if (updates.unassignUsers) q.assignedUserIds = q.assignedUserIds.filter(id => !updates.unassignUsers.includes(id));
                        }
                    });
                    break;
                }

                // === QUEST GROUP ACTIONS ===
                case 'ADD_QUEST_GROUP': {
                    const newGroup = { ...payload, id: `qg-${Date.now()}` };
                    data.questGroups.push(newGroup);
                    result = newGroup;
                    break;
                }
                case 'UPDATE_QUEST_GROUP': {
                    const groupIndex = data.questGroups.findIndex(g => g.id === payload.id);
                    if (groupIndex > -1) data.questGroups[groupIndex] = payload;
                    break;
                }
                case 'DELETE_QUEST_GROUP': {
                    data.questGroups = data.questGroups.filter(g => g.id !== payload.groupId);
                    data.quests.forEach(q => {
                        if (q.groupId === payload.groupId) q.groupId = undefined;
                    });
                    break;
                }
                case 'ASSIGN_QUEST_GROUP_TO_USERS': {
                    const { groupId, userIds } = payload;
                    data.quests.forEach(q => {
                        if (q.groupId === groupId) {
                            q.assignedUserIds = [...new Set([...q.assignedUserIds, ...userIds])];
                        }
                    });
                    break;
                }
                 // === REWARD ACTIONS ===
                case 'ADD_REWARD_TYPE': {
                    const newReward = { ...payload, id: `reward-${Date.now()}`, isCore: false };
                    data.rewardTypes.push(newReward);
                    result = newReward;
                    break;
                }
                case 'UPDATE_REWARD_TYPE': {
                    const index = data.rewardTypes.findIndex(rt => rt.id === payload.id);
                    if (index > -1) data.rewardTypes[index] = payload;
                    break;
                }
                case 'DELETE_REWARD_TYPE': {
                    data.rewardTypes = data.rewardTypes.filter(rt => rt.id !== payload.rewardTypeId);
                    break;
                }
                case 'CLONE_REWARD_TYPE': {
                    const toClone = data.rewardTypes.find(rt => rt.id === payload.rewardTypeId);
                    if (toClone) {
                        const newReward = { ...toClone, id: `reward-${Date.now()}`, name: `${toClone.name} (Copy)`, isCore: false };
                        data.rewardTypes.push(newReward);
                    }
                    break;
                }
                 // === MARKET ACTIONS ===
                case 'ADD_MARKET': {
                    const newMarket = { ...payload, id: `market-${Date.now()}` };
                    data.markets.push(newMarket);
                    result = newMarket;
                    break;
                }
                case 'UPDATE_MARKET': {
                    const index = data.markets.findIndex(m => m.id === payload.id);
                    if (index > -1) data.markets[index] = payload;
                    break;
                }
                case 'DELETE_MARKET': {
                    data.markets = data.markets.filter(m => m.id !== payload.marketId);
                    break;
                }
                case 'CLONE_MARKET': {
                    const toClone = data.markets.find(m => m.id === payload.marketId);
                    if (toClone) {
                        const newMarket = { ...toClone, id: `market-${Date.now()}`, title: `${toClone.title} (Copy)` };
                        data.markets.push(newMarket);
                    }
                    break;
                }
                case 'DELETE_MARKETS': {
                    const idsToDelete = new Set(payload.marketIds);
                    data.markets = data.markets.filter(m => !idsToDelete.has(m.id));
                    break;
                }
                case 'UPDATE_MARKETS_STATUS': {
                    const { marketIds, status } = payload;
                    data.markets.forEach(m => {
                        if (marketIds.includes(m.id)) {
                            m.status = { type: status };
                        }
                    });
                    break;
                }
                // === TROPHY & RANK ACTIONS ===
                case 'ADD_TROPHY': {
                    const newTrophy = { ...payload, id: `trophy-${Date.now()}` };
                    data.trophies.push(newTrophy);
                    result = newTrophy;
                    break;
                }
                case 'UPDATE_TROPHY': {
                    const index = data.trophies.findIndex(t => t.id === payload.id);
                    if (index > -1) data.trophies[index] = payload;
                    break;
                }
                case 'DELETE_TROPHY': {
                    data.trophies = data.trophies.filter(t => t.id !== payload.trophyId);
                    break;
                }
                case 'CLONE_TROPHY': {
                    const toClone = data.trophies.find(t => t.id === payload.trophyId);
                    if (toClone) {
                        const newTrophy = { ...toClone, id: `trophy-${Date.now()}`, name: `${toClone.name} (Copy)` };
                        data.trophies.push(newTrophy);
                    }
                    break;
                }
                case 'DELETE_TROPHIES': {
                    const idsToDelete = new Set(payload.trophyIds);
                    data.trophies = data.trophies.filter(t => !idsToDelete.has(t.id));
                    break;
                }
                case 'AWARD_TROPHY': {
                    const { userId, trophyId, guildId } = payload;
                    data.userTrophies.push({ id: `ut-${Date.now()}`, userId, trophyId, awardedAt: new Date().toISOString(), guildId });
                    break;
                }
                 case 'SET_RANKS': {
                    data.ranks = payload.ranks;
                    break;
                }
                // === CHAT ACTIONS ===
                case 'SEND_MESSAGE': {
                    const { senderId, recipientId, guildId, message, isAnnouncement } = payload;
                    const newMessage = {
                        id: `msg-${Date.now()}-${Math.random()}`,
                        senderId, message,
                        timestamp: new Date().toISOString(),
                        readBy: [senderId],
                    };
                    if (recipientId) newMessage.recipientId = recipientId;
                    if (guildId) newMessage.guildId = guildId;
                    if (isAnnouncement) newMessage.isAnnouncement = isAnnouncement;
                    data.chatMessages.push(newMessage);
                    break;
                }
                case 'MARK_MESSAGES_AS_READ': {
                    const { partnerId, guildId, currentUserId } = payload;
                    data.chatMessages.forEach(msg => {
                        const isUnread = !msg.readBy.includes(currentUserId);
                        if (isUnread) {
                            if (guildId && msg.guildId === guildId) msg.readBy.push(currentUserId);
                            else if (partnerId && msg.recipientId === currentUserId && msg.senderId === partnerId) msg.readBy.push(currentUserId);
                        }
                    });
                    break;
                }
                case 'UPDATE_SETTINGS': {
                    data.settings = { ...data.settings, ...payload };
                    break;
                }
                case 'RESET_SETTINGS': {
                    data.settings = INITIAL_SETTINGS;
                    break;
                }
                case 'PURCHASE_MARKET_ITEM': {
                    const { assetId, userId, costGroupIndex, guildId } = payload;
                    const user = data.users.find(u => u.id === userId);
                    const asset = data.gameAssets.find(a => a.id === assetId);
                    if (!user || !asset) throw new Error("User or Asset not found");
                    const cost = asset.costGroups[costGroupIndex];
                    if (!cost) throw new Error("Invalid cost group");
                    const balanceTarget = guildId ? (user.guildBalances[guildId] || { purse: {}, experience: {} }) : { purse: user.personalPurse, experience: user.personalExperience };
                    for (const item of cost) {
                        const rewardDef = data.rewardTypes.find(rt => rt.id === item.rewardTypeId);
                        if (!rewardDef) throw new Error("Invalid reward type in cost");
                        const balanceKey = rewardDef.category === RewardCategory.Currency ? 'purse' : 'experience';
                        if ((balanceTarget[balanceKey][item.rewardTypeId] || 0) < item.amount) throw new Error("You can't afford this item.");
                    }
                    
                    applySetbacks(user, cost, guildId);
                    
                    const newPurchaseRequest = {
                        id: `pr-${Date.now()}`, userId, assetId, requestedAt: new Date().toISOString(),
                        status: asset.requiresApproval ? 'Pending' : 'Completed', assetDetails: { name: asset.name, description: asset.description, cost }, guildId,
                    };
                    
                    if (asset.requiresApproval) {
                        data.purchaseRequests.push(newPurchaseRequest);
                    } else {
                        newPurchaseRequest.actedAt = new Date().toISOString();
                        user.ownedAssetIds.push(assetId);
                        if (asset.linkedThemeId && !user.ownedThemes.includes(asset.linkedThemeId)) user.ownedThemes.push(asset.linkedThemeId);
                        applyRewards(user, asset.payouts || [], guildId);
                        asset.purchaseCount = (asset.purchaseCount || 0) + 1;
                        data.purchaseRequests.push(newPurchaseRequest);
                    }
                    break;
                }
                 case 'APPROVE_PURCHASE_REQUEST': {
                    const purchase = data.purchaseRequests.find(pr => pr.id === payload.purchaseId);
                    const user = data.users.find(u => u.id === purchase.userId);
                    const asset = data.gameAssets.find(a => a.id === purchase.assetId);
                    if (purchase && user && asset) {
                        purchase.status = 'Completed';
                        purchase.actedAt = new Date().toISOString();
                        user.ownedAssetIds.push(asset.id);
                        if (asset.linkedThemeId && !user.ownedThemes.includes(asset.linkedThemeId)) user.ownedThemes.push(asset.linkedThemeId);
                        applyRewards(user, asset.payouts || [], purchase.guildId);
                        asset.purchaseCount = (asset.purchaseCount || 0) + 1;
                    }
                    break;
                }
                case 'REJECT_PURCHASE_REQUEST': {
                     const purchase = data.purchaseRequests.find(pr => pr.id === payload.purchaseId);
                     const user = data.users.find(u => u.id === purchase.userId);
                     if(purchase && user) {
                         purchase.status = 'Rejected';
                         purchase.actedAt = new Date().toISOString();
                         applyRewards(user, purchase.assetDetails.cost, purchase.guildId);
                     }
                    break;
                }
                 case 'CANCEL_PURCHASE_REQUEST': {
                     const purchase = data.purchaseRequests.find(pr => pr.id === payload.purchaseId);
                     const user = data.users.find(u => u.id === purchase.userId);
                     if(purchase && user) {
                         purchase.status = 'Cancelled';
                         purchase.actedAt = new Date().toISOString();
                         applyRewards(user, purchase.assetDetails.cost, purchase.guildId);
                     }
                    break;
                }
                case 'ADD_THEME': {
                    const newTheme = { ...payload, id: `theme-custom-${Date.now()}` };
                    data.themes.push(newTheme);
                    result = newTheme;
                    break;
                }
                case 'UPDATE_THEME': {
                    const index = data.themes.findIndex(t => t.id === payload.id);
                    if (index > -1) data.themes[index] = payload;
                    break;
                }
                case 'DELETE_THEME': {
                    data.themes = data.themes.filter(t => t.id !== payload.themeId);
                    break;
                }
                 case 'ADD_GUILD': {
                    const newGuild = { ...payload, id: `guild-${Date.now()}` };
                    data.guilds.push(newGuild);
                    break;
                }
                case 'UPDATE_GUILD': {
                    const index = data.guilds.findIndex(g => g.id === payload.id);
                    if (index > -1) data.guilds[index] = payload;
                    break;
                }
                case 'DELETE_GUILD': {
                    data.guilds = data.guilds.filter(g => g.id !== payload.guildId);
                    break;
                }
                case 'APPLY_MANUAL_ADJUSTMENT': {
                    const newAdjustment = { ...payload, id: `adj-${Date.now()}`, adjustedAt: new Date().toISOString() };
                    data.adminAdjustments.push(newAdjustment);
                    const user = data.users.find(u => u.id === payload.userId);
                    if (user) {
                        applyRewards(user, payload.rewards, payload.guildId);
                        applySetbacks(user, payload.setbacks, payload.guildId);
                    }
                    break;
                }
                case 'ADD_GAME_ASSET': {
                    const newAsset = { ...payload, id: `ga-${Date.now()}`, creatorId: 'admin', createdAt: new Date().toISOString(), purchaseCount: 0 };
                    data.gameAssets.push(newAsset);
                    break;
                }
                case 'UPDATE_GAME_ASSET': {
                    const index = data.gameAssets.findIndex(ga => ga.id === payload.id);
                    if (index > -1) data.gameAssets[index] = payload;
                    break;
                }
                case 'DELETE_GAME_ASSET': {
                    data.gameAssets = data.gameAssets.filter(ga => ga.id !== payload.assetId);
                    break;
                }
                case 'DELETE_GAME_ASSETS': {
                    const idsToDelete = new Set(payload.assetIds);
                    data.gameAssets = data.gameAssets.filter(ga => !idsToDelete.has(ga.id));
                    break;
                }
                case 'CLONE_GAME_ASSET': {
                    const toClone = data.gameAssets.find(ga => ga.id === payload.assetId);
                    if (toClone) {
                        const newAsset = { ...toClone, id: `ga-${Date.now()}`, name: `${toClone.name} (Copy)` };
                        data.gameAssets.push(newAsset);
                    }
                    break;
                }
                 case 'EXECUTE_EXCHANGE': {
                    const { userId, payItem, receiveItem, guildId } = payload;
                    const user = data.users.find(u => u.id === userId);
                    if (!user) throw new Error("User not found for exchange");
                    applySetbacks(user, [payItem], guildId);
                    applyRewards(user, [receiveItem], guildId);
                    break;
                }
                default:
                    console.warn(`[SERVER ACTION] Unhandled action type: ${type}`);
                    break;
            }
            console.log('[ACTION] Data modified in memory. Preparing to write to DB.');
            await writeData(data);
            console.log('[ACTION] DB write complete. Broadcasting state update.');
            await broadcastStateUpdate();
            console.log('[ACTION] Broadcast complete. Sending success response.');
            res.status(200).json(result);
        } catch (error) {
            console.error(`[ACTION] FAILED to process action ${type}:`, error);
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/first-run', async (req, res) => {
        try {
            const { adminUserData, setupChoice, blueprint } = req.body;
            const initialData = createInitialData(setupChoice, adminUserData, blueprint);
            await writeData(initialData);
            const adminUser = initialData.users.find(u => u.role === Role.DonegeonMaster);
            res.status(201).json({ message: 'First run completed', adminUser, fullData: initialData });
        } catch (error) {
            console.error("First run setup failed:", error);
            res.status(500).json({ error: 'Failed to initialize data' });
        }
    });

    app.post('/api/actions/reinitialize', async (req, res) => {
        try {
            await writeData({});
            broadcastStateUpdate();
            res.status(200).json({ message: 'Application reinitialized.' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to reinitialize.' });
        }
    });

    app.get('/api/ai/status', (req, res) => res.json({ isConfigured: !!process.env.API_KEY }));

    app.post('/api/ai/test', async (req, res) => {
        if (!process.env.API_KEY) return res.status(400).json({ success: false, error: 'API_KEY not set.' });
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "test" });
            res.json({ success: true, message: 'API key is valid.' });
        } catch (error) {
            res.status(400).json({ success: false, error: 'API key is invalid.' });
        }
    });

    app.post('/api/ai/generate', async (req, res) => {
        if (!process.env.API_KEY) return res.status(500).json({ error: "AI not configured." });
        const { prompt, model, generationConfig } = req.body;
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({ model: model || 'gemini-2.5-flash', contents: prompt, config: generationConfig });
            res.json({ text: response.text });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

main().catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
});