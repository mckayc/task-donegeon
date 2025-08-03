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
            const data = await readData();
            
            // Helper function to apply rewards
            const applyRewards = (user, rewards, guildId) => {
                if (!user) return;
                const balanceTarget = guildId 
                    ? (user.guildBalances[guildId] = user.guildBalances[guildId] || { purse: {}, experience: {} }) 
                    : { purse: user.personalPurse, experience: user.personalExperience };

                rewards.forEach(rewardItem => {
                    const rewardDef = data.rewardTypes.find(rt => rt.id === rewardItem.rewardTypeId);
                    if (rewardDef) {
                        const balanceKey = rewardDef.category === RewardCategory.Currency ? 'purse' : 'experience';
                        balanceTarget[balanceKey][rewardItem.rewardTypeId] = (balanceTarget[balanceKey][rewardItem.rewardTypeId] || 0) + rewardItem.amount;
                    }
                });
            };

            switch(type) {
                // USER
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

                // QUESTS
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
                    if(completion) {
                        completion.status = QuestCompletionStatus.Approved;
                        const quest = data.quests.find(q => q.id === completion.questId);
                        const user = data.users.find(u => u.id === completion.userId);
                        if(quest && user) applyRewards(user, quest.rewards, completion.guildId);
                    }
                    break;
                }
                case 'REJECT_QUEST_COMPLETION': {
                    const completion = data.questCompletions.find(c => c.id === payload.completionId);
                    if(completion) completion.status = QuestCompletionStatus.Rejected;
                    break;
                }
                case 'ADD_QUEST_GROUP': {
                    const newGroup = { ...payload, id: `qg-${Date.now()}` };
                    data.questGroups.push(newGroup);
                    result = newGroup;
                    break;
                }
                case 'UPDATE_SETTINGS': {
                    data.settings = { ...data.settings, ...payload };
                    break;
                }
                case 'PURCHASE_MARKET_ITEM': {
                    const { assetId, userId, costGroupIndex, guildId } = payload;
                    const user = data.users.find(u => u.id === userId);
                    const asset = data.gameAssets.find(a => a.id === assetId);
                    if (!user || !asset) throw new Error("User or Asset not found");
                    const cost = asset.costGroups[costGroupIndex];
                    if (!cost) throw new Error("Invalid cost group");
                    const balanceTarget = guildId ? (user.guildBalances[guildId] = user.guildBalances[guildId] || { purse: {}, experience: {} }) : { purse: user.personalPurse, experience: user.personalExperience };
                    for (const item of cost) {
                        const rewardDef = data.rewardTypes.find(rt => rt.id === item.rewardTypeId);
                        if (!rewardDef) throw new Error("Invalid reward type in cost");
                        const balanceKey = rewardDef.category === RewardCategory.Currency ? 'purse' : 'experience';
                        if ((balanceTarget[balanceKey][item.rewardTypeId] || 0) < item.amount) throw new Error("You can't afford this item.");
                    }
                    const newPurchaseRequest = {
                        id: `pr-${Date.now()}`, userId, assetId, requestedAt: new Date().toISOString(),
                        status: asset.requiresApproval ? 'Pending' : 'Completed', assetDetails: { name: asset.name, description: asset.description, cost }, guildId,
                    };
                    cost.forEach(item => {
                        const rewardDef = data.rewardTypes.find(rt => rt.id === item.rewardTypeId);
                        if (rewardDef) {
                            const balanceKey = rewardDef.category === RewardCategory.Currency ? 'purse' : 'experience';
                            balanceTarget[balanceKey][item.rewardTypeId] -= item.amount;
                        }
                    });
                    if (asset.requiresApproval) {
                        data.purchaseRequests.push(newPurchaseRequest);
                    } else {
                        newPurchaseRequest.actedAt = new Date().toISOString();
                        user.ownedAssetIds.push(assetId);
                        if (asset.linkedThemeId && !user.ownedThemes.includes(asset.linkedThemeId)) user.ownedThemes.push(asset.linkedThemeId);
                        (asset.payouts || []).forEach(payout => {
                            const rewardDef = data.rewardTypes.find(rt => rt.id === payout.rewardTypeId);
                            if (rewardDef) {
                                const balanceKey = rewardDef.category === RewardCategory.Currency ? 'purse' : 'experience';
                                balanceTarget[balanceKey][payout.rewardTypeId] = (balanceTarget[balanceKey][payout.rewardTypeId] || 0) + payout.amount;
                            }
                        });
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
                         (asset.payouts || []).forEach(payout => {
                            const balanceTarget = purchase.guildId ? (user.guildBalances[purchase.guildId] = user.guildBalances[purchase.guildId] || { purse: {}, experience: {} }) : { purse: user.personalPurse, experience: user.personalExperience };
                            const rewardDef = data.rewardTypes.find(rt => rt.id === payout.rewardTypeId);
                            if (rewardDef) {
                                const balanceKey = rewardDef.category === RewardCategory.Currency ? 'purse' : 'experience';
                                balanceTarget[balanceKey][payout.rewardTypeId] = (balanceTarget[balanceKey][payout.rewardTypeId] || 0) + payout.amount;
                            }
                        });
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
                         // Refund
                         applyRewards(user, purchase.assetDetails.cost, purchase.guildId);
                     }
                    break;
                }
                case 'ADD_THEME': {
                    const newTheme = { ...payload, id: `theme-custom-${Date.now()}` };
                    data.themes.push(newTheme);
                    result = newTheme; // Return the new theme with its ID
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
                case 'SET_RANKS': {
                    data.ranks = payload.ranks;
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