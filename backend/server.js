

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const http = require('http');
const WebSocket = require('ws');
const { GoogleGenAI } = require('@google/genai');
const sqlite3 = require('sqlite3').verbose();

// === IN-MEMORY MIGRATIONS ===
const MIGRATION_SCRIPTS = {
    '001_initial_schema.sql': `
-- Version 1: Initial Schema
CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY, json TEXT NOT NULL);
INSERT OR IGNORE INTO data (id, json) VALUES (1, '{}');
CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);
INSERT OR IGNORE INTO schema_version (version) VALUES (1);
`,
    '002_add_chat_table.sql': `
-- Version 2: Dedicated Chat Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    senderId TEXT NOT NULL,
    recipientId TEXT,
    guildId TEXT,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    readBy TEXT DEFAULT '[]',
    isAnnouncement BOOLEAN DEFAULT 0
);
UPDATE schema_version SET version = 2 WHERE version = 1;
`
};

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const DB_PATH = path.join(__dirname, 'db');
const DB_FILE = path.join(DB_PATH, 'data.db');
const UPLOADS_PATH = path.join(__dirname, '../uploads');
const BACKUPS_PATH = path.join(DB_PATH, 'backups');

let db;

// == DB & MIGRATION LOGIC ==
const runMigrations = (db) => new Promise((resolve, reject) => {
    db.serialize(async () => {
        try {
            await new Promise((res, rej) => db.run("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)", err => err ? rej(err) : res()));
            const versionRow = await new Promise((res, rej) => db.get("SELECT version FROM schema_version", (err, row) => err ? rej(err) : res(row)));
            let currentVersion = versionRow ? versionRow.version : 0;
            
            if (currentVersion === 0) {
                 await new Promise((res, rej) => db.run(MIGRATION_SCRIPTS['001_initial_schema.sql'], err => err ? rej(err) : res()));
                 currentVersion = 1;
                 console.log("Bootstrapped database to version 1.");
            }

            if (currentVersion < 2) {
                console.log("Migrating to version 2 (Chat Table)...");
                await new Promise((res, rej) => db.exec(MIGRATION_SCRIPTS['002_add_chat_table.sql'], err => err ? rej(err) : res()));
                await migrateChatDataFromBlob(db);
                console.log("Successfully migrated to version 2.");
            }
            resolve();
        } catch(err) {
            reject(new Error(`Migration failed: ${err.message}`));
        }
    });
});

const migrateChatDataFromBlob = (db) => new Promise(async (resolve, reject) => {
    try {
        console.log("Checking for chat messages in JSON blob to migrate...");
        const row = await new Promise((res, rej) => db.get("SELECT json FROM data WHERE id = 1", (err, row) => err ? rej(err) : res(row)));
        if (!row || !row.json) return resolve();

        const data = JSON.parse(row.json);
        if (!data.chatMessages || data.chatMessages.length === 0) {
            console.log("No chat messages found in blob. Migration not needed.");
            return resolve();
        }

        console.log(`Found ${data.chatMessages.length} messages to migrate. Starting transaction...`);
        await new Promise((res, rej) => db.run("BEGIN TRANSACTION", err => err ? rej(err) : res()));

        const stmt = db.prepare("INSERT INTO chat_messages (id, senderId, recipientId, guildId, message, timestamp, readBy, isAnnouncement) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        for (const msg of data.chatMessages) {
            await new Promise((res, rej) => stmt.run(
                msg.id, msg.senderId, msg.recipientId, msg.guildId,
                msg.message, msg.timestamp, JSON.stringify(msg.readBy || []), msg.isAnnouncement || 0,
            err => err ? rej(err) : res()));
        }
        await new Promise((res, rej) => stmt.finalize(err => err ? rej(err) : res()));

        delete data.chatMessages;
        const cleanedJson = JSON.stringify(data);
        await new Promise((res, rej) => db.run("UPDATE data SET json = ? WHERE id = 1", [cleanedJson], err => err ? rej(err) : res()));

        await new Promise((res, rej) => db.run("COMMIT", err => err ? rej(err) : res()));
        console.log("Chat migration completed successfully.");
        resolve();
    } catch (err) {
        await new Promise(res => db.run("ROLLBACK", () => res()));
        reject(new Error(`Chat migration failed: ${err.message}`));
    }
});

const sanitizeDataOnStartup = async () => {
    try {
        console.log("Running startup data sanitization...");
        const data = await readCoreData();
        let changesMade = false;

        // Sanitize Guilds
        if (data.guilds && data.users) {
            const userIds = new Set(data.users.map(u => u.id));
            data.guilds.forEach(guild => {
                const originalMemberCount = guild.memberIds.length;
                guild.memberIds = guild.memberIds.filter(id => userIds.has(id));
                if (guild.memberIds.length !== originalMemberCount) {
                    changesMade = true;
                    console.log(`Sanitized guild "${guild.name}": Removed ${originalMemberCount - guild.memberIds.length} orphaned members.`);
                }
            });
        }

        if (changesMade) {
            console.log("Sanitization found issues. Writing corrected data back to DB.");
            await writeCoreData(data);
        } else {
            console.log("Sanitization complete. No issues found.");
        }
    } catch(err) {
        console.error("Error during data sanitization:", err.message);
    }
};


// Ensure all required directories exist, then connect to DB
Promise.all([
    fs.mkdir(DB_PATH, { recursive: true }),
    fs.mkdir(UPLOADS_PATH, { recursive: true }),
    fs.mkdir(BACKUPS_PATH, { recursive: true })
]).then(() => {
    db = new sqlite3.Database(DB_FILE, (err) => {
        if (err) return console.error('Failed to connect to SQLite:', err.message);
        console.log('Connected to the SQLite database.');
        runMigrations(db)
            .then(() => sanitizeDataOnStartup())
            .then(() => console.log("Database is ready."))
            .catch(err => {
                console.error("CRITICAL: DATABASE SETUP FAILED.", err);
                process.exit(1);
            });
    });
}).catch(err => {
    console.error('Failed to create required directories:', err);
    process.exit(1);
});

// WebSocket connection handling
wss.on('connection', ws => {
    console.log('Client connected');
    ws.on('message', async (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === 'SEND_CHAT_MESSAGE') {
                const newChatMessage = parsedMessage.payload;
                const stmt = db.prepare("INSERT INTO chat_messages (id, senderId, recipientId, guildId, message, timestamp, readBy, isAnnouncement) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                await new Promise((res, rej) => stmt.run(
                    newChatMessage.id, newChatMessage.senderId, newChatMessage.recipientId, newChatMessage.guildId,
                    newChatMessage.message, newChatMessage.timestamp, JSON.stringify(newChatMessage.readBy || []), newChatMessage.isAnnouncement || 0,
                    err => err ? rej(err) : res()
                ));
                stmt.finalize();

                // Broadcast ONLY the new message, not the full state
                const broadcastMessage = JSON.stringify({ type: 'NEW_CHAT_MESSAGE', payload: newChatMessage });
                wss.clients.forEach(client => { if (client.readyState === WebSocket.OPEN) client.send(broadcastMessage); });
            }
        } catch (e) { console.error("Error processing WebSocket message:", e); }
    });
    ws.on('close', () => console.log('Client disconnected'));
});


const broadcastStateUpdate = async () => {
    try {
        const data = await readData();
        const message = JSON.stringify({ type: 'FULL_STATE_UPDATE', payload: data });
        wss.clients.forEach(client => { if (client.readyState === WebSocket.OPEN) client.send(message); });
    } catch (error) { console.error("Failed to broadcast state update:", error); }
};

// Data persistence functions
const readCoreData = () => new Promise((resolve, reject) => {
    db.get('SELECT json FROM data WHERE id = 1', [], (err, row) => {
        if (err) return reject(err);
        try {
            resolve(row && row.json ? JSON.parse(row.json) : {});
        } catch (e) {
            reject(new Error("Failed to parse core data JSON."));
        }
    });
});

const writeCoreData = (data) => new Promise((resolve, reject) => {
    const { chatMessages, ...coreData } = data; // Ensure chatMessages are never written to the blob
    db.run('REPLACE INTO data (id, json) VALUES (1, ?)', [JSON.stringify(coreData)], err => err ? reject(err) : resolve());
});

const readChatMessages = () => new Promise((resolve, reject) => {
    db.all("SELECT * FROM chat_messages", [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => ({...row, readBy: JSON.parse(row.readBy), isAnnouncement: !!row.isAnnouncement })));
    });
});

const readData = async () => {
    const [coreData, chatMessages] = await Promise.all([readCoreData(), readChatMessages()]);
    return { ...coreData, chatMessages };
};


// Multer Setup
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const category = req.body.category || 'Miscellaneous';
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9\s_-]/g, '').trim();
    const dir = path.join(UPLOADS_PATH, sanitizedCategory);
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// API routes
app.get('/api/data', async (req, res) => {
    try {
        const data = await readData();
        res.json(data);
    } catch (error) { res.status(500).json({ error: 'Failed to read data' }); }
});

// This route is now DEPRECATED in favor of granular endpoints, but kept for backup/restore.
app.post('/api/data', async (req, res) => {
    try {
        await writeCoreData(req.body);
        broadcastStateUpdate();
        res.status(200).send({ message: 'Data saved' });
    } catch (error) { res.status(500).json({ error: 'Failed to save data' }); }
});

app.post('/api/first-run', async (req, res) => {
    try {
        const { adminUserData, setupChoice, blueprint } = req.body;
        const initialData = createInitialData(setupChoice, adminUserData, blueprint);
        await writeCoreData(initialData);
        broadcastStateUpdate();
        const adminUser = initialData.users.find(u => u.role === 'Donegeon Master');
        res.status(201).json({ message: 'First run completed', adminUser });
    } catch (error) { res.status(500).json({ error: 'Failed to initialize data' }); }
});

app.post('/api/completions/:completionId/approve', async (req, res) => {
    try {
        const { completionId } = req.params;
        const { note } = req.body;
        const data = await readCoreData();

        const completionIndex = data.questCompletions.findIndex(c => c.id === completionId);
        if (completionIndex === -1) return res.status(404).json({ error: 'Completion not found.' });
        
        const completion = data.questCompletions[completionIndex];
        if (completion.status !== 'Pending') return res.status(400).json({ error: 'Completion is not pending.' });

        const user = data.users.find(u => u.id === completion.userId);
        const quest = data.quests.find(q => q.id === completion.questId);
        if (!user || !quest) return res.status(404).json({ error: 'Associated user or quest not found.' });

        quest.rewards.forEach(reward => {
            const rewardDef = data.rewardTypes.find(rt => rt.id === reward.rewardTypeId);
            if (!rewardDef) return;
            let targetBalance;
            if (completion.guildId) {
                if (!user.guildBalances[completion.guildId]) user.guildBalances[completion.guildId] = { purse: {}, experience: {} };
                targetBalance = user.guildBalances[completion.guildId];
            } else {
                targetBalance = { purse: user.personalPurse, experience: user.personalExperience };
            }
            const key = rewardDef.category === 'Currency' ? 'purse' : 'experience';
            targetBalance[key][rewardDef.id] = (targetBalance[key][rewardDef.id] || 0) + reward.amount;
        });

        completion.status = 'Approved';
        if (note) completion.note = completion.note ? `${completion.note}\nApprover: ${note}` : `Approver: ${note}`;
        
        await writeCoreData(data);
        broadcastStateUpdate();
        res.status(200).json({ message: 'Quest approved.' });
    } catch (error) { res.status(500).json({ error: 'Failed to approve quest.' }); }
});

app.post('/api/completions/:completionId/reject', async (req, res) => {
    try {
        const { completionId } = req.params;
        const { note } = req.body;
        const data = await readCoreData();
        const completion = data.questCompletions.find(c => c.id === completionId);
        if (!completion || completion.status !== 'Pending') return res.status(400).json({ error: 'Completion not found or not pending.' });
        
        completion.status = 'Rejected';
        if (note) completion.note = completion.note ? `${completion.note}\nRejecter: ${note}` : `Rejecter: ${note}`;

        await writeCoreData(data);
        broadcastStateUpdate();
        res.status(200).json({ message: 'Quest rejected.' });
    } catch (error) { res.status(500).json({ error: 'Failed to reject quest.' }); }
});

app.post('/api/chat/read', async (req, res) => {
    const { userId, partnerId, guildId } = req.body;
    if (!userId || (!partnerId && !guildId)) return res.status(400).json({ error: 'Missing parameters' });
    
    try {
        let condition, params;
        if (partnerId) {
            condition = `(recipientId = ? AND senderId = ?) OR (recipientId = ? AND senderId = ?)`;
            params = [userId, partnerId, partnerId, userId];
        } else {
            condition = `guildId = ?`;
            params = [guildId];
        }

        const rows = await new Promise((resolve, reject) => {
            db.all(`SELECT id, readBy FROM chat_messages WHERE ${condition}`, params, (err, rows) => err ? reject(err) : resolve(rows));
        });

        const updates = rows
            .map(row => ({ ...row, readBy: JSON.parse(row.readBy || '[]') }))
            .filter(row => !row.readBy.includes(userId))
            .map(row => ({ id: row.id, readBy: JSON.stringify([...row.readBy, userId]) }));

        if (updates.length > 0) {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");
                const stmt = db.prepare("UPDATE chat_messages SET readBy = ? WHERE id = ?");
                updates.forEach(u => stmt.run(u.readBy, u.id));
                stmt.finalize();
                db.run("COMMIT");
            });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Failed to mark chat as read:", error);
        res.status(500).json({ error: 'Database error' });
    }
});


// ... (other action routes like exchange, factory-reset)
app.post('/api/actions/exchange', async (req, res) => {
    try {
        const { userId, payItem, receiveItem, guildId } = req.body;
        const data = await readCoreData();

        const user = data.users.find(u => u.id === userId);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        
        const payRewardDef = data.rewardTypes.find(rt => rt.id === payItem.rewardTypeId);
        const receiveRewardDef = data.rewardTypes.find(rt => rt.id === receiveItem.rewardTypeId);
        if (!payRewardDef || !receiveRewardDef) return res.status(400).json({ error: 'Invalid reward types.' });

        let balance;
        if (guildId) {
            if (!user.guildBalances[guildId]) user.guildBalances[guildId] = { purse: {}, experience: {} };
            balance = user.guildBalances[guildId];
        } else {
            balance = { purse: user.personalPurse, experience: user.personalExperience };
        }
        const key = payRewardDef.category === 'Currency' ? 'purse' : 'experience';
        if ((balance[key][payItem.rewardTypeId] || 0) < payItem.amount) return res.status(400).json({ error: 'Insufficient funds.' });

        balance[key][payItem.rewardTypeId] -= payItem.amount;
        const receiveKey = receiveRewardDef.category === 'Currency' ? 'purse' : 'experience';
        balance[receiveKey][receiveItem.rewardTypeId] = (balance[receiveKey][receiveItem.rewardTypeId] || 0) + receiveItem.amount;

        await writeCoreData(data);
        broadcastStateUpdate();
        res.status(200).json({ message: 'Exchange successful.' });
    } catch (error) { res.status(500).json({ error: 'Failed to process exchange.' }); }
});

app.post('/api/actions/factory-reset', async (req, res) => {
    try {
        const data = await readCoreData();
        const users = data.users;
        const freshData = createInitialData('scratch', users[0]);
        freshData.users = users;
        await writeCoreData(freshData);
        broadcastStateUpdate();
        res.status(200).json({ message: 'Factory reset successful.' });
    } catch (error) { res.status(500).json({ error: 'Factory reset failed.' }); }
});

app.post('/api/actions/reinitialize', async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            db.run('REPLACE INTO data (id, json) VALUES (1, ?)', ['{}'], err => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
             db.run('DELETE FROM chat_messages', err => err ? reject(err) : resolve());
        });
        broadcastStateUpdate();
        res.status(200).json({ message: 'Application reinitialized.' });
    } catch (error) { res.status(500).json({ error: 'Reinitialization failed.' }); }
});


// AI Routes
app.get('/api/ai/status', (req, res) => res.json({ isConfigured: !!process.env.API_KEY }));
app.post('/api/ai/test', async (req, res) => {
    if (!process.env.API_KEY) return res.status(400).json({ success: false, error: 'API_KEY not set.' });
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "test" });
        res.json({ success: true });
    } catch (error) { res.status(400).json({ success: false, error: 'Invalid API key.' }); }
});

app.post('/api/ai/generate', async (req, res) => {
    if (!process.env.API_KEY) return res.status(500).json({ error: "AI not configured." });
    const { prompt, model, generationConfig } = req.body;
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({ model: model || 'gemini-2.5-flash', contents: prompt, config: generationConfig });
        res.json({ text: response.text });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Media Routes
app.post('/api/media/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);
    res.json({ url: `/${relativePath.replace(/\\/g, '/')}` });
});

app.get('/api/media/local-gallery', async (req, res) => {
    try {
        const getFiles = async (dir, category = '') => {
            const dirents = await fs.readdir(dir, { withFileTypes: true });
            const files = await Promise.all(dirents.map(async (dirent) => {
                const resPath = path.resolve(dir, dirent.name);
                if (dirent.isDirectory()) return getFiles(resPath, dirent.name);
                const url = `/uploads/${category ? `${category}/` : ''}${dirent.name}`;
                return { url, category: category || 'Miscellaneous', name: dirent.name };
            }));
            return Array.prototype.concat(...files);
        };
        const gallery = await getFiles(UPLOADS_PATH);
        res.json(gallery);
    } catch (error) { res.status(500).json({ error: "Could not read image gallery." }); }
});

app.post('/api/media/import-pack', async (req, res) => {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) return res.status(400).json({ error: 'Invalid file list' });
    try {
        for (const file of files) {
            const dir = path.join(UPLOADS_PATH, file.category);
            await fs.mkdir(dir, { recursive: true });
            const destPath = path.join(dir, file.name);
            const response = await fetch(file.url);
            if (!response.ok) throw new Error(`Failed to download ${file.name}`);
            const buffer = Buffer.from(await response.arrayBuffer());
            await fs.writeFile(destPath, buffer);
        }
        res.status(200).json({ message: 'Import successful!' });
    } catch (error) { res.status(500).json({ error: 'Failed to import pack: ' + error.message }); }
});

// Backup Routes (unchanged)
app.post('/api/backups/create', async (req, res) => {
    try {
        const data = await readData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.json`;
        const filepath = path.join(BACKUPS_PATH, filename);
        await fs.writeFile(filepath, JSON.stringify(data, null, 2));
        res.json({ message: `Backup created: ${filename}` });
    } catch (error) { res.status(500).json({ error: 'Failed to create backup.' }); }
});

app.get('/api/backups', async (req, res) => {
    try {
        const files = await fs.readdir(BACKUPS_PATH);
        const backups = await Promise.all(
            files.filter(f => f.endsWith('.json')).map(async f => {
                const stats = await fs.stat(path.join(BACKUPS_PATH, f));
                return { filename: f, createdAt: stats.mtime, size: stats.size, isAuto: f.startsWith('auto-') };
            })
        );
        res.json(backups.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) { res.status(500).json({ error: 'Failed to list backups.' }); }
});

app.get('/api/backups/:filename', (req, res) => res.download(path.join(BACKUPS_PATH, req.params.filename)));

app.post('/api/backups/restore/:filename', async (req, res) => {
    try {
        const filepath = path.join(BACKUPS_PATH, req.params.filename);
        const backupData = JSON.parse(await fs.readFile(filepath, 'utf-8'));
        const { chatMessages, ...coreData } = backupData;
        await writeCoreData(coreData);
        // Clear and re-insert chat messages
        await new Promise((resolve, reject) => db.run('DELETE FROM chat_messages', err => err ? reject(err) : resolve()));
        if (chatMessages && chatMessages.length > 0) {
            const stmt = db.prepare("INSERT INTO chat_messages (id, senderId, recipientId, guildId, message, timestamp, readBy, isAnnouncement) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            for (const msg of chatMessages) {
                await new Promise((res, rej) => stmt.run(msg.id, msg.senderId, msg.recipientId, msg.guildId, msg.message, msg.timestamp, JSON.stringify(msg.readBy || []), msg.isAnnouncement || 0, err => err ? rej(err) : res()));
            }
            stmt.finalize();
        }
        broadcastStateUpdate();
        res.json({ message: 'Restore successful.' });
    } catch (error) { res.status(500).json({ error: 'Failed to restore backup.' }); }
});

app.delete('/api/backups/:filename', async (req, res) => {
    try {
        await fs.unlink(path.join(BACKUPS_PATH, req.params.filename));
        res.json({ message: 'Backup deleted.' });
    } catch (error) { res.status(500).json({ error: 'Failed to delete backup.' }); }
});

// Serve main app
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// Inlined Data for initial setup
const createInitialData = (setupChoice = 'guided', adminUserData, blueprint) => {
    const { createMockUsers, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_THEMES, INITIAL_MAIN_SIDEBAR_CONFIG, INITIAL_SETTINGS, INITIAL_TROPHIES, createSampleQuests, INITIAL_QUEST_GROUPS, createSampleMarkets, createSampleGameAssets, createInitialGuilds } = require('./data.js');
    let baseData;
    let users = [];
    if (setupChoice === 'scratch') {
        const adminUser = { ...adminUserData, id: `user-admin-${Date.now()}`, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false };
        users.push(adminUser);
        baseData = {
            quests: [], questGroups: [], markets: createSampleMarkets().filter(m => m.id === 'market-bank'), rewardTypes: INITIAL_REWARD_TYPES, questCompletions: [],
            purchaseRequests: [], guilds: createInitialGuilds(users), ranks: INITIAL_RANKS, trophies: [], userTrophies: [], adminAdjustments: [],
            gameAssets: [], systemLogs: [], settings: INITIAL_SETTINGS, themes: INITIAL_THEMES, loginHistory: [], systemNotifications: [], scheduledEvents: [],
        };
    } else if (setupChoice === 'import' && blueprint) {
        const adminUser = { ...adminUserData, id: `user-admin-${Date.now()}`, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false };
        users.push(adminUser);
        const finalRewardTypes = [ ...INITIAL_REWARD_TYPES, ...(blueprint.assets.rewardTypes || []).filter(rt => !INITIAL_REWARD_TYPES.some(coreRt => coreRt.id === rt.id)) ];
        let finalMarkets = blueprint.assets.markets || [];
        if (!finalMarkets.some(m => m.id === 'market-bank')) {
            const bankMarket = createSampleMarkets().find(m => m.id === 'market-bank');
            if (bankMarket) finalMarkets.push(bankMarket);
        }
        baseData = {
            ...blueprint.assets, rewardTypes: finalRewardTypes, markets: finalMarkets, guilds: createInitialGuilds(users),
            questCompletions: [], purchaseRequests: [], userTrophies: [], adminAdjustments: [], systemLogs: [], loginHistory: [], systemNotifications: [], scheduledEvents: [],
            settings: INITIAL_SETTINGS, themes: INITIAL_THEMES,
        };
    } else { // 'guided'
        users = createMockUsers();
        if(adminUserData) users[0] = { ...users[0], ...adminUserData };
        baseData = {
            quests: createSampleQuests(users), questGroups: INITIAL_QUEST_GROUPS, markets: createSampleMarkets(), rewardTypes: INITIAL_REWARD_TYPES,
            questCompletions: [], purchaseRequests: [], guilds: createInitialGuilds(users), ranks: INITIAL_RANKS, trophies: INITIAL_TROPHIES,
            userTrophies: [], adminAdjustments: [], gameAssets: createSampleGameAssets(), systemLogs: [], settings: INITIAL_SETTINGS,
            themes: INITIAL_THEMES, loginHistory: [], systemNotifications: [], scheduledEvents: [],
        };
    }
    const finalAdminUser = users[0];
    if (adminUserData) Object.assign(finalAdminUser, adminUserData, { id: `user-admin-${Date.now()}` });
    return { ...baseData, users, settings: { ...baseData.settings, isFirstRunComplete: true } };
}
