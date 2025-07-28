
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const http = require('http');
const WebSocket = require('ws');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the 'dist' directory (Vite build output)
app.use(express.static(path.join(__dirname, '..', 'dist')));
// Serve uploaded media files
const UPLOAD_DIR = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR));


// === DATABASE SETUP ===
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
} catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
}

const initializeDb = async () => {
    if (!pool) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_data (
                key TEXT PRIMARY KEY,
                value JSONB NOT NULL
            );
        `);
        const res = await pool.query("SELECT value FROM app_data WHERE key = 'appState'");
        if (res.rows.length === 0) {
            const { INITIAL_SETTINGS, INITIAL_THEMES } = require('../data/initialData');
            const initialData = {
                users: [], quests: [], questGroups: [], markets: [], rewardTypes: [], questCompletions: [],
                purchaseRequests: [], guilds: [], ranks: [], trophies: [], userTrophies: [],
                adminAdjustments: [], gameAssets: [], systemLogs: [], settings: INITIAL_SETTINGS,
                themes: INITIAL_THEMES, loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: [],
            };
            await pool.query("INSERT INTO app_data (key, value) VALUES ('appState', $1)", [JSON.stringify(initialData)]);
            console.log("Database seeded with initial structure.");
        }
    } catch (error) {
        console.error("Error initializing database:", error);
    }
};

const saveData = async (data) => {
    if (!pool) throw new Error("Database not connected.");
    await pool.query(
        "INSERT INTO app_data (key, value) VALUES ('appState', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
        [JSON.stringify(data)]
    );
};

const loadData = async () => {
    if (!pool) throw new Error("Database not connected.");
    const res = await pool.query("SELECT value FROM app_data WHERE key = 'appState'");
    if (res.rows.length === 0) {
        await initializeDb(); // Attempt to initialize if it failed on start
        const secondAttempt = await pool.query("SELECT value FROM app_data WHERE key = 'appState'");
        if (secondAttempt.rows.length === 0) throw new Error("No data found in database.");
        return secondAttempt.rows[0].value;
    }
    return res.rows[0].value;
};

// === WEBSOCKET SETUP ===
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
wss.on('connection', ws => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
});
const broadcast = (data) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};
const broadcastUpdate = async (sourceWs = null) => {
    const data = await loadData();
    const message = { type: 'FULL_STATE_UPDATE', payload: data };
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};

// === FILE UPLOAD (LOCAL) ===
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const category = req.body.category || 'Miscellaneous';
        const categoryPath = path.join(UPLOAD_DIR, category);
        await fs.mkdir(categoryPath, { recursive: true });
        cb(null, categoryPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`);
    }
});
const upload = multer({ storage });

// === BACKUP SETUP ===
const BACKUP_DIR = process.env.BACKUP_PATH || path.join(__dirname, 'backups');
fs.mkdir(BACKUP_DIR, { recursive: true }).catch(console.error);

// === GENERIC CRUD HANDLER ===
const handleRequest = async (res, logic) => {
    try {
        const data = await loadData();
        const result = await logic(data);
        await saveData(data);
        await broadcastUpdate();
        if (result !== undefined) {
             res.status(result.status || 200).json(result.body || { message: 'Success' });
        } else {
             res.status(204).send();
        }
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: error.message || 'An internal server error occurred.' });
    }
};

// === API ENDPOINTS ===

// --- SETUP & DATA ---
app.get('/api/pre-run-check', async (req, res) => {
    try {
        const data = await loadData();
        if (data && data.users && data.users.length > 0) {
            res.json({
                dataExists: true,
                version: data.settings.contentVersion || 1,
                appName: data.settings.terminology.appName || 'Task Donegeon'
            });
        } else {
            res.json({ dataExists: false });
        }
    } catch (error) {
        res.json({ dataExists: false });
    }
});

app.post('/api/first-run', (req, res) => handleRequest(res, async (data) => {
    const { adminUserData, setupChoice, blueprint } = req.body;
    if (data.users.length > 0) throw new Error('First run has already been completed.');
    
    const { createMockUsers, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, createSampleMarkets, createSampleQuests, createInitialGuilds, createSampleGameAssets, INITIAL_THEMES, INITIAL_QUEST_GROUPS } = require('../data/initialData');

    const adminUser = {
        ...adminUserData, id: `user-1`, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
        guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: true,
    };
    data.users.push(adminUser);

    if (setupChoice === 'guided') {
        const mockUsers = createMockUsers();
        data.users[0] = { ...mockUsers.find(u => u.username === 'admin'), ...adminUser };
        data.users.push(mockUsers.find(u => u.username === 'explorer'));
        data.users.push(mockUsers.find(u => u.username === 'gatekeeper'));
        data.rewardTypes = INITIAL_REWARD_TYPES;
        data.ranks = INITIAL_RANKS;
        data.trophies = INITIAL_TROPHIES;
        data.markets = createSampleMarkets();
        data.quests = createSampleQuests(data.users);
        data.guilds = createInitialGuilds(data.users);
        data.gameAssets = createSampleGameAssets();
        data.themes = INITIAL_THEMES;
        data.questGroups = INITIAL_QUEST_GROUPS;
    } else { // scratch or import
        data.rewardTypes = INITIAL_REWARD_TYPES;
        data.ranks = INITIAL_RANKS;
        data.themes = INITIAL_THEMES;
        data.guilds = createInitialGuilds(data.users);
        data.markets.push({ id: 'market-bank', title: 'The Exchange Post', description: 'Exchange your various currencies and experience points.', iconType: 'emoji', icon: '⚖️', status: { type: 'open' } });
        if (setupChoice === 'import' && blueprint) {
            Object.keys(blueprint.assets).forEach(key => {
                if (data[key] && blueprint.assets[key]) {
                    data[key].push(...blueprint.assets[key]);
                }
            });
        }
    }
    data.settings.contentVersion = 2;
    return { status: 201, body: { message: 'First run completed.' } };
}));

app.get('/api/data', async (req, res) => {
    try {
        const data = await loadData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load data.' });
    }
});

app.post('/api/data', (req, res) => handleRequest(res, async (data) => {
    Object.assign(data, req.body);
}));

// --- USERS ---
app.post('/api/users', (req, res) => handleRequest(res, (data) => {
    const newUser = { ...req.body, id: `user-${Date.now()}`, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false };
    data.users.push(newUser);
    return { status: 201, body: newUser };
}));
app.put('/api/users/:id', (req, res) => handleRequest(res, (data) => {
    const index = data.users.findIndex(u => u.id === req.params.id);
    if (index === -1) throw new Error('User not found.');
    data.users[index] = { ...data.users[index], ...req.body };
}));
app.delete('/api/users/:id', (req, res) => handleRequest(res, (data) => {
    data.users = data.users.filter(u => u.id !== req.params.id);
}));

// --- GENERIC CRUD ---
const createCrudEndpoints = (resource, prefix) => {
    app.post(`/api/${resource}`, (req, res) => handleRequest(res, (data) => {
        const newItem = { ...req.body, id: `${prefix}-${Date.now()}` };
        data[resource].push(newItem);
        return { status: 201, body: newItem };
    }));
    app.put(`/api/${resource}/:id`, (req, res) => handleRequest(res, (data) => {
        const index = data[resource].findIndex(i => i.id === req.params.id);
        if (index === -1) throw new Error(`${resource} not found.`);
        data[resource][index] = { ...data[resource][index], ...req.body };
    }));
    app.delete(`/api/${resource}/:id`, (req, res) => handleRequest(res, (data) => {
        data[resource] = data[resource].filter(i => i.id !== req.params.id);
    }));
};
['quests', 'questGroups', 'rewardTypes', 'markets', 'guilds', 'trophies', 'themes', 'scheduledEvents'].forEach(r => createCrudEndpoints(r, r.slice(0, 3)));

// --- SPECIAL ENDPOINTS ---
app.post('/api/quests/:id/actions', (req, res) => handleRequest(res, (data) => {
    const quest = data.quests.find(q => q.id === req.params.id);
    if (!quest) throw new Error('Quest not found.');
    quest.todoUserIds = quest.todoUserIds || [];
    if (req.body.action === 'mark_todo') {
        if (!quest.todoUserIds.includes(req.body.userId)) quest.todoUserIds.push(req.body.userId);
    } else if (req.body.action === 'unmark_todo') {
        quest.todoUserIds = quest.todoUserIds.filter(id => id !== req.body.userId);
    }
}));
app.post('/api/quests/:id/complete', (req, res) => handleRequest(res, (data) => {
    const { userId, note, completionDate } = req.body;
    const quest = data.quests.find(q => q.id === req.params.id);
    if (!quest) throw new Error('Quest not found.');
    const newCompletion = {
        id: `qc-${Date.now()}`, questId: req.params.id, userId,
        completedAt: completionDate || new Date().toISOString(),
        status: quest.requiresApproval ? 'Pending' : 'Approved',
        note, guildId: quest.guildId,
    };
    data.questCompletions.push(newCompletion);
    // If not requiring approval, grant rewards now (logic mirrored from frontend)
    if (!quest.requiresApproval) {
        const user = data.users.find(u => u.id === userId);
        quest.rewards.forEach(reward => {
            const rewardType = data.rewardTypes.find(rt => rt.id === reward.rewardTypeId);
            if (!rewardType) return;
            let balanceTarget;
            if (quest.guildId) {
                user.guildBalances[quest.guildId] = user.guildBalances[quest.guildId] || { purse: {}, experience: {} };
                balanceTarget = rewardType.category === 'Currency' ? user.guildBalances[quest.guildId].purse : user.guildBalances[quest.guildId].experience;
            } else {
                balanceTarget = rewardType.category === 'Currency' ? user.personalPurse : user.personalExperience;
            }
            balanceTarget[reward.rewardTypeId] = (balanceTarget[reward.rewardTypeId] || 0) + reward.amount;
        });
    }
}));

app.post('/api/gameAssets', (req, res) => handleRequest(res, (data) => {
    const newAsset = { ...req.body, id: `ga-${Date.now()}`, creatorId: 'system', createdAt: new Date().toISOString(), purchaseCount: 0 };
    data.gameAssets.push(newAsset);
    return { status: 201, body: newAsset };
}));
app.put('/api/gameAssets/:id', (req, res) => handleRequest(res, (data) => {
    const index = data.gameAssets.findIndex(i => i.id === req.params.id);
    if (index === -1) throw new Error('gameAsset not found.');
    data.gameAssets[index] = { ...data.gameAssets[index], ...req.body };
}));
app.delete('/api/gameAssets/:id', (req, res) => handleRequest(res, (data) => {
    data.gameAssets = data.gameAssets.filter(i => i.id !== req.params.id);
}));

app.post('/api/economy/exchange', (req, res) => handleRequest(res, (data) => {
    const { userId, payItem, receiveItem, guildId } = req.body;
    const user = data.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    const payRewardType = data.rewardTypes.find(rt => rt.id === payItem.rewardTypeId);
    const receiveRewardType = data.rewardTypes.find(rt => rt.id === receiveItem.rewardTypeId);
    if (!payRewardType || !receiveRewardType) throw new Error('Reward type not found.');

    const payPurse = guildId ? user.guildBalances[guildId].purse : user.personalPurse;
    const payXp = guildId ? user.guildBalances[guildId].experience : user.personalExperience;
    const receivePurse = guildId ? user.guildBalances[guildId].purse : user.personalPurse;
    const receiveXp = guildId ? user.guildBalances[guildId].experience : user.personalExperience;

    const payBalance = payRewardType.category === 'Currency' ? payPurse : payXp;
    if ((payBalance[payItem.rewardTypeId] || 0) < payItem.amount) throw new Error('Insufficient funds.');
    
    payBalance[payItem.rewardTypeId] -= payItem.amount;
    const receiveBalance = receiveRewardType.category === 'Currency' ? receivePurse : receiveXp;
    receiveBalance[receiveItem.rewardTypeId] = (receiveBalance[receiveItem.rewardTypeId] || 0) + receiveItem.amount;
}));

// --- CHAT & NOTIFICATIONS ---
app.post('/api/chat/messages', (req, res) => handleRequest(res, (data) => {
    const newMessage = { ...req.body, id: `msg-${Date.now()}`, timestamp: new Date().toISOString(), readBy: [req.body.senderId] };
    data.chatMessages.push(newMessage);
    broadcast({ type: 'NEW_CHAT_MESSAGE', payload: newMessage });
    return { status: 201, body: newMessage };
}));
app.post('/api/chat/read', (req, res) => handleRequest(res, (data) => {
    const { userId, partnerId, guildId } = req.body;
    data.chatMessages.forEach(msg => {
        const isDmMatch = partnerId && ((msg.senderId === partnerId && msg.recipientId === userId));
        const isGuildMatch = guildId && msg.guildId === guildId;
        if ((isDmMatch || isGuildMatch) && !msg.readBy.includes(userId)) {
            msg.readBy.push(userId);
        }
    });
}));
app.post('/api/systemNotifications', (req, res) => handleRequest(res, (data) => {
    const newNotif = { ...req.body, id: `sysnotif-${Date.now()}`, timestamp: new Date().toISOString(), readByUserIds: [] };
    data.systemNotifications.push(newNotif);
    return { status: 201, body: newNotif };
}));
app.post('/api/systemNotifications/read', (req, res) => handleRequest(res, (data) => {
    const { notificationIds, userId } = req.body;
    data.systemNotifications.forEach(n => {
        if (notificationIds.includes(n.id) && !n.readByUserIds.includes(userId)) {
            n.readByUserIds.push(userId);
        }
    });
}));

// --- MEDIA & AI ---
app.post('/api/media/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const category = req.body.category || 'Miscellaneous';
    res.json({ url: `/uploads/${encodeURIComponent(category)}/${encodeURIComponent(req.file.filename)}` });
});
app.get('/api/media/local-gallery', async (req, res) => {
    try {
        const categories = await fs.readdir(UPLOAD_DIR);
        const allImages = [];
        for (const category of categories) {
            const categoryPath = path.join(UPLOAD_DIR, category);
            if ((await fs.stat(categoryPath)).isDirectory()) {
                const files = await fs.readdir(categoryPath);
                files.forEach(file => allImages.push({ url: `/uploads/${category}/${file}`, category, name: file }));
            }
        }
        res.json(allImages);
    } catch { res.json([]); }
});

const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;
app.get('/api/ai/status', (req, res) => res.json({ isConfigured: !!ai }));
app.post('/api/ai/test', async (req, res) => {
    if (!ai) return res.status(400).json({ error: 'API key not configured.' });
    try {
        await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'API key test failed.' }); }
});
app.post('/api/ai/generate', async (req, res) => {
    if (!ai) return res.status(400).json({ error: 'AI not configured.' });
    try {
        const { prompt, generationConfig, model } = req.body;
        const response = await ai.models.generateContent({ model: model || 'gemini-2.5-flash', contents: prompt, config: generationConfig });
        res.json(response);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- BACKUPS ---
app.get('/api/backups', async (req, res) => {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backups = await Promise.all(files.filter(f => f.endsWith('.json')).map(async f => {
            const stats = await fs.stat(path.join(BACKUP_DIR, f));
            return { filename: f, createdAt: stats.mtime.toISOString(), size: stats.size };
        }));
        res.json(backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch { res.json([]); }
});
app.post('/api/backups/create', async (req, res) => {
    try {
        const data = await loadData();
        const filename = `backup_${new Date().toISOString().replace(/:/g, '-')}.json`;
        await fs.writeFile(path.join(BACKUP_DIR, filename), JSON.stringify(data, null, 2));
        res.json({ message: 'Backup created.' });
    } catch (e) { res.status(500).json({ error: 'Backup failed.' }); }
});
app.get('/api/backups/:filename', (req, res) => {
    const filePath = path.join(BACKUP_DIR, req.params.filename);
    res.download(filePath);
});
app.delete('/api/backups/:filename', async (req, res) => {
    try {
        await fs.unlink(path.join(BACKUP_DIR, req.params.filename));
        res.json({ message: 'Backup deleted.' });
    } catch (e) { res.status(500).json({ error: 'Delete failed.' }); }
});
app.post('/api/backups/restore/:filename', (req, res) => handleRequest(res, async () => {
    const backupData = await fs.readFile(path.join(BACKUP_DIR, req.params.filename), 'utf-8');
    // A restore is just a POST to /api/data, but need to load the file first.
    const dataToRestore = JSON.parse(backupData);
    await saveData(dataToRestore); // Manually save, don't use handleRequest's auto-save on an empty object
    broadcast({ type: 'FULL_STATE_UPDATE', payload: dataToRestore });
    res.json({ message: 'Restore successful.' });
}));


// Fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
    await initializeDb();
    console.log(`Server running on port ${PORT}`);
});
