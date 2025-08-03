





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
    // Correctly create the HTTP server with the Express app.
    const server = http.createServer(app);
    // Attach Primus to the server. It will now handle WebSocket connections
    // and dynamically serve its client library at /primus.js.
    const primus = new Primus(server, { transformer: 'websockets' });
    
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

    const broadcastStateUpdate = (data) => {
        try {
            console.log('[BROADCAST] Sending in-memory state to all clients...');
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
        try {
            console.log('[ACTION] Reading current state from DB...');
            const originalData = await readData();
            let data = JSON.parse(JSON.stringify(originalData));
            let result = { success: true };
            
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
                        if (quest) {
                            applyRewards(user, quest.rewards, completion.guildId);
                        }
                    }
                    break;
                }
                 case 'REJECT_QUEST_COMPLETION': {
                    const completion = data.questCompletions.find(c => c.id === payload.completionId);
                    if(completion) completion.status = QuestCompletionStatus.Rejected;
                    break;
                }
                 case 'SEND_MESSAGE': {
                    const newMessage = {
                        id: `msg-${Date.now()}`,
                        ...payload,
                        timestamp: new Date().toISOString(),
                        readBy: [payload.senderId], // Sender has read it by default
                    };
                    data.chatMessages.push(newMessage);
                    break;
                }
                
                // === SCHEDULED EVENT ACTIONS ===
                case 'ADD_SCHEDULED_EVENT': {
                    const newId = `event-${Date.now()}`;
                    data.scheduledEvents.push({ ...payload, id: newId });
                    break;
                }
                case 'UPDATE_SCHEDULED_EVENT': {
                    const eventIndex = data.scheduledEvents.findIndex(e => e.id === payload.id);
                    if (eventIndex > -1) {
                        data.scheduledEvents[eventIndex] = payload;
                    }
                    break;
                }
                case 'DELETE_SCHEDULED_EVENT': {
                    data.scheduledEvents = data.scheduledEvents.filter(e => e.id !== payload.eventId);
                    break;
                }

                // ... other cases ...
            }
            
            console.log('[ACTION] Writing updated state back to DB...');
            await writeData(data);
            console.log('[ACTION] DB write complete. Broadcasting state update...');
            broadcastStateUpdate(data);
            res.status(200).json({ success: true, message: 'Action processed', result, fullState: data });
        } catch (error) {
            console.error(`[ACTION] Error processing action ${type}:`, error);
            res.status(500).json({ success: false, error: error.message || 'An unknown server error occurred.' });
        }
    });
    
    // ... rest of the server file (first run, AI routes, etc.) ...

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });

    const PORT = process.env.PORT || 3001;
    // VERY IMPORTANT: Use the `server` object to listen, not the `app` object.
    // This allows both Express and Primus (WebSockets) to handle incoming connections.
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

main().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});