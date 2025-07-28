
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs').promises;
const WebSocket = require('ws');
const { Pool } = require('pg');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');

// --- CONSTANTS ---
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const BACKUP_DIR = process.env.BACKUP_PATH || path.join(__dirname, 'backups');
const AI_MODEL = 'gemini-2.5-flash';

// --- DATABASE LOGIC ---
let pool;
try {
    console.log("Attempting to create PostgreSQL pool...");
    const sslConfig = (process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('sslmode=require')))
        ? { rejectUnauthorized: false }
        : undefined;

    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: sslConfig });
    console.log("PostgreSQL pool created successfully.");
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });
} catch (error) {
    console.error("Failed to create PostgreSQL pool:", error);
}

const initializeDb = async () => {
    if (!pool) return console.error("Database pool is not available. Skipping DB initialization.");
    try {
        console.log("Initializing database...");
        await pool.query(`CREATE TABLE IF NOT EXISTS app_data (key TEXT PRIMARY KEY, value JSONB NOT NULL);`);
        const res = await pool.query("SELECT value FROM app_data WHERE key = 'appState'");
        if (res.rows.length === 0) {
            console.log("No existing data found. Seeding database with guided setup...");
            const initialDataContent = require('./initialData');
            const mockUsers = initialDataContent.createMockUsers();
            const initialData = {
                users: mockUsers,
                quests: initialDataContent.createSampleQuests(mockUsers),
                questGroups: initialDataContent.INITIAL_QUEST_GROUPS,
                markets: initialDataContent.createSampleMarkets(),
                rewardTypes: initialDataContent.INITIAL_REWARD_TYPES,
                questCompletions: [], purchaseRequests: [],
                guilds: initialDataContent.createInitialGuilds(mockUsers),
                ranks: initialDataContent.INITIAL_RANKS,
                trophies: initialDataContent.INITIAL_TROPHIES,
                userTrophies: [], adminAdjustments: [],
                gameAssets: initialDataContent.createSampleGameAssets(),
                systemLogs: [],
                settings: { ...initialDataContent.INITIAL_SETTINGS, contentVersion: 2 },
                themes: initialDataContent.INITIAL_THEMES,
                loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: [],
            };
            await pool.query("INSERT INTO app_data (key, value) VALUES ('appState', $1)", [JSON.stringify(initialData)]);
            console.log("Database seeded.");
        } else {
            console.log("Existing data found. Initialization complete.");
        }
    } catch (error) {
        console.error("Error initializing database:", error);
        throw error;
    }
};

const loadData = async () => {
    if (!pool) throw new Error("Database not connected.");
    const res = await pool.query("SELECT value FROM app_data WHERE key = 'appState'");
    if (res.rows.length === 0) {
      console.warn("No data found in DB. Attempting to re-initialize...");
      await initializeDb();
      const secondAttempt = await pool.query("SELECT value FROM app_data WHERE key = 'appState'");
      if (secondAttempt.rows.length === 0) throw new Error("No data found after re-initialization.");
      return secondAttempt.rows[0].value;
    }
    return res.rows[0].value;
};

const saveData = async (data) => {
    if (!pool) throw new Error("Database not connected.");
    await pool.query(
        "INSERT INTO app_data (key, value) VALUES ('appState', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
        [JSON.stringify(data)]
    );
};

// --- WEBSOCKET LOGIC ---
let wss;
const initWebSocket = (server) => {
    wss = new WebSocket.Server({ server });
    wss.on('connection', ws => console.log('Client connected via WebSocket'));
};
const broadcast = (message) => {
    if (!wss) return;
    const data = JSON.stringify(message);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(data);
    });
};
const broadcastUpdate = async () => {
    try {
        const data = await loadData();
        broadcast({ type: 'FULL_STATE_UPDATE', payload: data });
    } catch (error) {
        console.error("Error broadcasting update:", error);
    }
};

// --- API HANDLER ---
const apiHandler = (handler) => async (req, res) => {
    try {
        const data = await loadData();
        const result = await handler(data, req, res);
        await saveData(data);
        await broadcastUpdate();
        if (result && result.status) return res.status(result.status).json(result.body || {});
        if (result && result.body) return res.status(200).json(result.body);
        res.status(204).send();
    } catch (error) {
        console.error(`API Error on ${req.method} ${req.path}:`, error);
        res.status(500).json({ error: error.message || 'An internal server error occurred.' });
    }
};

// --- EXPRESS APP SETUP ---
const app = express();
const server = http.createServer(app);
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);
fs.mkdir(BACKUP_DIR, { recursive: true }).catch(console.error);
initWebSocket(server);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`); next(); });
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, '..', 'dist')));

// --- API ROUTES ---

// Data Routes
app.get('/api/pre-run-check', async (req, res) => { /* ... unchanged ... */ });
app.post('/api/first-run', apiHandler((data, req) => { /* ... unchanged ... */ }));
app.get('/api/data', async (req, res) => { /* ... unchanged ... */ });
app.post('/api/data', apiHandler((data, req) => { Object.assign(data, req.body); }));

// User Routes
app.post('/api/users', apiHandler((data, req) => {
    const newUser = { ...req.body, id: `user-${Date.now()}`, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false };
    data.users.push(newUser);
    return { status: 201, body: newUser };
}));
app.put('/api/users/:id', apiHandler((data, req) => {
    const index = data.users.findIndex(u => u.id === req.params.id);
    if (index === -1) throw new Error('User not found.');
    data.users[index] = { ...data.users[index], ...req.body };
}));
app.delete('/api/users/:id', apiHandler((data, req) => { data.users = data.users.filter(u => u.id !== req.params.id); }));

// Quest Routes
app.post('/api/quests/:id/actions', apiHandler((data, req) => { /* ... unchanged ... */ }));
app.post('/api/quests/:id/complete', apiHandler((data, req) => { /* ... unchanged ... */ }));

// Chat & Notification Routes
app.post('/api/chat/messages', apiHandler((data, req) => { /* ... unchanged ... */ }));
app.post('/api/chat/read', apiHandler((data, req) => { /* ... unchanged ... */ }));
app.post('/api/systemNotifications', apiHandler((data, req) => { /* ... unchanged ... */ }));
app.post('/api/systemNotifications/read', apiHandler((data, req) => { /* ... unchanged ... */ }));

// Media Routes
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
app.post('/api/media/upload', upload.single('file'), (req, res) => { /* ... unchanged ... */ });
app.get('/api/media/local-gallery', async (req, res) => { /* ... unchanged ... */ });

// AI Routes
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;
app.get('/api/ai/status', (req, res) => res.json({ isConfigured: !!ai }));
app.post('/api/ai/test', async (req, res) => { /* ... unchanged ... */ });
app.post('/api/ai/generate', async (req, res) => { /* ... unchanged ... */ });

// Backup Routes
app.get('/api/backups', async (req, res) => { /* ... unchanged ... */ });
app.post('/api/backups/create', async (req, res) => { /* ... unchanged ... */ });
app.get('/api/backups/:filename', (req, res) => { /* ... unchanged ... */ });
app.delete('/api/backups/:filename', async (req, res) => { /* ... unchanged ... */ });
app.post('/api/backups/restore/:filename', apiHandler(async (data, req) => { /* ... unchanged ... */ }));

// Economy Routes
app.post('/api/economy/exchange', apiHandler((data, req) => { /* ... unchanged ... */ }));

// Generic CRUD Routes
const createCrudEndpoints = (resourceName, prefix) => {
    app.post(`/api/${resourceName}`, apiHandler((data, req) => {
        const newItem = { ...req.body, id: `${prefix}-${Date.now()}` };
        if(resourceName === 'gameAssets') Object.assign(newItem, { creatorId: 'system', createdAt: new Date().toISOString(), purchaseCount: 0 });
        data[resourceName].push(newItem);
        return { status: 201, body: newItem };
    }));
    app.put(`/api/${resourceName}/:id`, apiHandler((data, req) => {
        const index = data[resourceName].findIndex(i => i.id === req.params.id);
        if (index === -1) throw new Error(`${resourceName} not found.`);
        data[resourceName][index] = { ...data[resourceName][index], ...req.body };
    }));
    app.delete(`/api/${resourceName}/:id`, apiHandler((data, req) => {
        data[resourceName] = data[resourceName].filter(i => i.id !== req.params.id);
    }));
};
[
    { resource: 'questGroups', prefix: 'qg' }, { resource: 'rewardTypes', prefix: 'rt' },
    { resource: 'markets', prefix: 'mkt' }, { resource: 'guilds', prefix: 'g' },
    { resource: 'trophies', prefix: 't' }, { resource: 'themes', prefix: 'th' },
    { resource: 'scheduledEvents', prefix: 'se' }, { resource: 'gameAssets', prefix: 'ga' },
].forEach(({ resource, prefix }) => createCrudEndpoints(resource, prefix));


// --- FALLBACK AND SERVER START ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
    try {
        await initializeDb();
        console.log(`Server listening on http://localhost:${PORT}`);
    } catch (error) {
        console.error("Failed to start server due to DB initialization failure:", error);
        process.exit(1);
    }
});
