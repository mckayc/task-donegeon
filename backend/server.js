
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const { GoogleGenAI } = require('@google/genai');
const http = require('http');
const WebSocket = require('ws');

// --- Environment Variable Checks ---
const requiredEnv = ['DATABASE_URL', 'STORAGE_PROVIDER'];
if (process.env.STORAGE_PROVIDER === 'supabase') {
    requiredEnv.push('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');
}
for (const envVar of requiredEnv) {
    if (!process.env[envVar]) {
        console.error(`FATAL ERROR: ${envVar} environment variable is not set.`);
        process.exit(1);
    }
}

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// === WebSocket Logic ===
wss.on('connection', ws => {
  console.log('Client connected to WebSocket');
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

const broadcast = (data) => {
  const jsonData = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonData);
    }
  });
};

// === Middleware ===
const allowedOrigins = ['https://taskdonegeon.mckayc.com', 'http://localhost:3000', 'http://localhost:3002'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// === Supabase Client (if applicable) ===
let supabase;
if (process.env.STORAGE_PROVIDER === 'supabase') {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// === Gemini AI Client ===
let ai;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("WARNING: API_KEY environment variable not set. AI features will be disabled.");
}

// === Multer Configuration for File Uploads ===
const UPLOADS_DIR = path.resolve('/app', 'uploads');
const storage = process.env.STORAGE_PROVIDER === 'supabase'
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: async (req, file, cb) => {
        const category = req.body.category || 'Miscellaneous';
        const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
        const finalDir = path.join(UPLOADS_DIR, sanitizedCategory);
        try {
            await fs.mkdir(finalDir, { recursive: true });
            cb(null, finalDir);
        } catch (err) {
            cb(err);
        }
      },
      filename: (req, file, cb) => {
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
        cb(null, `${Date.now()}-${sanitizedFilename}`);
      }
    });

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const BACKUP_DIR = process.env.BACKUP_PATH || path.join(__dirname, 'backups');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

let dbReady = false;

const initializeDatabase = async () => {
    let retries = 5;
    while (retries > 0) {
        try {
            const client = await pool.connect();
            try {
                await client.query(`
                    CREATE TABLE IF NOT EXISTS app_data (
                        key TEXT PRIMARY KEY,
                        value JSONB NOT NULL
                    );
                `);
                console.log("Table 'app_data' is ready.");
                await fs.mkdir(BACKUP_DIR, { recursive: true });
                console.log(`Backup directory is ready at: ${BACKUP_DIR}`);
                dbReady = true;
                return; // Success
            } finally {
                client.release();
            }
        } catch (err) {
            console.error(`Database initialization failed, ${retries - 1} retries left...`, err.message);
            retries -= 1;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    console.error('Could not connect to database after several retries. The server will run in a degraded state.');
    dbReady = false;
};

initializeDatabase();

const checkDbConnection = async () => {
    let client;
    try {
        client = await pool.connect();
        await client.query('SELECT NOW()');
        dbReady = true;
        return true;
    } catch (err) {
        console.error("Database connection check failed:", err.message);
        dbReady = false;
        return false;
    } finally {
        if (client) client.release();
    }
}

const dbHealthCheckMiddleware = async (req, res, next) => {
    if (dbReady) return next();
    
    const isConnected = await checkDbConnection();
    if (isConnected) {
        return next();
    }
    
    res.status(503).json({ error: 'Database is currently unavailable. Please try again later.' });
};


const loadData = async () => {
    const result = await pool.query('SELECT value FROM app_data WHERE key = $1', ['app_state']);
    return result.rows[0]?.value || { users: [], quests: [], markets: [], rewardTypes: [], questCompletions: [], purchaseRequests: [], guilds: [], ranks: [], trophies: [], userTrophies: [], adminAdjustments: [], gameAssets: [], systemLogs: [], settings: {}, themes: [], loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: [] };
};

const saveData = async (data) => {
    const dataString = JSON.stringify(data);
    await pool.query(
        `INSERT INTO app_data (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2;`,
        ['app_state', dataString]
    );
};

// === API Action Handler ===
const handleApiAction = async (res, action) => {
    try {
        const data = await loadData();
        const result = action(data);
        await saveData(data);
        broadcast({ type: 'DATA_UPDATED' });
        res.status(200).json(result || { success: true });
    } catch (err) {
        console.error("API Action Error:", err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const applyRewards = (user, rewardsToApply, rewardTypes, guildId) => {
    rewardsToApply.forEach(reward => {
        const rewardDef = rewardTypes.find(rd => rd.id === reward.rewardTypeId);
        if (!rewardDef) return;
        
        if (guildId) {
            const guildBalance = user.guildBalances[guildId] = user.guildBalances[guildId] || { purse: {}, experience: {} };
            if (rewardDef.category === 'Currency') {
                guildBalance.purse[reward.rewardTypeId] = (guildBalance.purse[reward.rewardTypeId] || 0) + reward.amount;
            } else { // XP
                guildBalance.experience[reward.rewardTypeId] = (guildBalance.experience[reward.rewardTypeId] || 0) + reward.amount;
            }
        } else { // Personal
            if (rewardDef.category === 'Currency') {
                user.personalPurse[reward.rewardTypeId] = (user.personalPurse[reward.rewardTypeId] || 0) + reward.amount;
            } else { // XP
                user.personalExperience[reward.rewardTypeId] = (user.personalExperience[reward.rewardTypeId] || 0) + reward.amount;
            }
        }
    });
};

const applySetbacks = (user, setbacksToApply, rewardTypes, guildId) => {
    setbacksToApply.forEach(setback => {
        const rewardDef = rewardTypes.find(rd => rd.id === setback.rewardTypeId);
        if (!rewardDef) return;

        if (guildId) {
            const guildBalance = user.guildBalances[guildId] = user.guildBalances[guildId] || { purse: {}, experience: {} };
            if (rewardDef.category === 'Currency') {
                guildBalance.purse[setback.rewardTypeId] = Math.max(0, (guildBalance.purse[setback.rewardTypeId] || 0) - setback.amount);
            } else {
                guildBalance.experience[setback.rewardTypeId] = Math.max(0, (guildBalance.experience[setback.rewardTypeId] || 0) - setback.amount);
            }
        } else {
            if (rewardDef.category === 'Currency') {
                user.personalPurse[setback.rewardTypeId] = Math.max(0, (user.personalPurse[setback.rewardTypeId] || 0) - setback.amount);
            } else {
                user.personalExperience[setback.rewardTypeId] = Math.max(0, (user.personalExperience[setback.rewardTypeId] || 0) - setback.amount);
            }
        }
    });
};


app.get('/api/health', async (req, res) => {
    const isConnected = await checkDbConnection();
    if (isConnected) {
        res.status(200).json({ status: 'ok' });
    } else {
        res.status(503).json({ status: 'error', message: 'Database connection failed' });
    }
});

app.get('/api/metadata', async (req, res, next) => {
    try {
        const metadataPath = path.join(__dirname, '..', 'metadata.json');
        res.sendFile(metadataPath);
    } catch (err) {
        next(err);
    }
});

// === Apply DB Health Check Middleware to all subsequent API routes ===
// Routes that don't need the DB (like AI status) can be placed before this line.
app.get('/api/ai/status', (req, res) => res.json({ isConfigured: !!ai }));
app.use('/api', dbHealthCheckMiddleware);


app.get('/api/data', async (req, res, next) => {
    try {
        const data = await loadData();
        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
});


// === GRANULAR API ENDPOINTS ===

// --- Users ---
app.post('/api/users', async (req, res) => handleApiAction(res, data => {
    const newUser = {
        ...req.body,
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        avatar: {},
        ownedAssetIds: [],
        personalPurse: {},
        personalExperience: {},
        guildBalances: {},
        ownedThemes: ['emerald', 'rose', 'sky'],
        hasBeenOnboarded: false
    };
    data.users.push(newUser);
    const defaultGuild = data.guilds.find(g => g.isDefault);
    if (defaultGuild) defaultGuild.memberIds.push(newUser.id);
    const roleTag = `tutorial-${newUser.role.toLowerCase().replace(/ /g, '-')}`;
    data.quests.forEach(q => {
        if (q.tags.includes(roleTag) && !q.assignedUserIds.includes(newUser.id)) {
            q.assignedUserIds.push(newUser.id);
        }
    });
    return { user: newUser };
}));
app.put('/api/users/:id', async (req, res) => handleApiAction(res, data => {
    const userIndex = data.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) throw { statusCode: 404, message: 'User not found' };
    data.users[userIndex] = { ...data.users[userIndex], ...req.body };
}));
app.delete('/api/users/:id', async (req, res) => handleApiAction(res, data => {
    const userId = req.params.id;
    data.users = data.users.filter(u => u.id !== userId);
    data.guilds.forEach(g => { g.memberIds = g.memberIds.filter(id => id !== userId); });
    data.quests.forEach(q => { q.assignedUserIds = q.assignedUserIds.filter(id => id !== userId); });
}));

// --- Adjustments ---
app.post('/api/adjustments', async (req, res) => handleApiAction(res, data => {
    const { userId, type, rewards, setbacks, trophyId, reason, adjusterId, guildId } = req.body;
    const user = data.users.find(u => u.id === userId);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const newAdjustment = {
        id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        adjustedAt: new Date().toISOString(),
        userId,
        adjusterId,
        type,
        reason,
        guildId: guildId || undefined,
        rewards: [],
        setbacks: [],
        trophyId,
    };

    if (type === 'Reward' && rewards) {
        applyRewards(user, rewards, data.rewardTypes, guildId);
        newAdjustment.rewards = rewards;
    } else if (type === 'Setback' && setbacks) {
        applySetbacks(user, setbacks, data.rewardTypes, guildId);
        newAdjustment.setbacks = setbacks;
    } else if (type === 'Trophy' && trophyId) {
        const alreadyHasTrophy = data.userTrophies.some(ut => ut.userId === userId && ut.trophyId === trophyId && ut.guildId === (guildId || undefined));
        if (!alreadyHasTrophy) {
            data.userTrophies.push({
                id: `ut-${Date.now()}`,
                userId,
                trophyId,
                awardedAt: new Date().toISOString(),
                guildId: guildId || undefined
            });
        }
    }

    data.adminAdjustments.push(newAdjustment);
}));

// --- Quests ---
app.post('/api/quests', async (req, res) => handleApiAction(res, data => {
    const newQuest = {
        ...req.body,
        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        claimedByUserIds: [],
        dismissals: [],
        todoUserIds: []
    };
    data.quests.push(newQuest);
}));
app.put('/api/quests/:id', async (req, res) => handleApiAction(res, data => {
    const questIndex = data.quests.findIndex(q => q.id === req.params.id);
    if (questIndex === -1) throw { statusCode: 404, message: 'Quest not found' };
    data.quests[questIndex] = req.body;
}));
app.post('/api/quests/:id/clone', async (req, res) => handleApiAction(res, data => {
    const questToClone = data.quests.find(q => q.id === req.params.id);
    if (!questToClone) throw { statusCode: 404, message: 'Quest not found' };
    const newQuest = {
        ...JSON.parse(JSON.stringify(questToClone)),
        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: `${questToClone.title} (Copy)`,
        claimedByUserIds: [], dismissals: [], todoUserIds: [],
    };
    data.quests.push(newQuest);
}));
app.post('/api/quests/:id/actions', async (req, res) => handleApiAction(res, data => {
    const { action, userId } = req.body;
    const quest = data.quests.find(q => q.id === req.params.id);
    if (!quest) throw { statusCode: 404, message: 'Quest not found' };
    switch (action) {
        case 'dismiss':
            quest.dismissals = [...quest.dismissals.filter(d => d.userId !== userId), { userId, dismissedAt: new Date().toISOString() }];
            break;
        case 'claim':
            quest.claimedByUserIds = [...quest.claimedByUserIds, userId];
            break;
        case 'release':
            quest.claimedByUserIds = quest.claimedByUserIds.filter(id => id !== userId);
            break;
        case 'mark_todo':
            quest.todoUserIds = Array.from(new Set([...(quest.todoUserIds || []), userId]));
            break;
        case 'unmark_todo':
            quest.todoUserIds = (quest.todoUserIds || []).filter(id => id !== userId);
            break;
        default:
            throw { statusCode: 400, message: 'Invalid quest action' };
    }
}));
app.post('/api/quests/bulk-update', async (req, res) => handleApiAction(res, data => {
    const { questIds, updates } = req.body;
    const questIdSet = new Set(questIds);
    data.quests.forEach(quest => {
        if (questIdSet.has(quest.id)) {
            if (updates.isActive !== undefined) quest.isActive = updates.isActive;
            if (updates.isOptional !== undefined) quest.isOptional = updates.isOptional;
            if (updates.requiresApproval !== undefined) quest.requiresApproval = updates.requiresApproval;
            if (updates.groupId !== undefined) quest.groupId = updates.groupId === null ? undefined : updates.groupId;
            if (updates.addTags) quest.tags = Array.from(new Set([...quest.tags, ...updates.addTags]));
            if (updates.removeTags) quest.tags = quest.tags.filter(tag => !updates.removeTags.includes(tag));
            if (updates.assignUsers) quest.assignedUserIds = Array.from(new Set([...quest.assignedUserIds, ...updates.assignUsers]));
            if (updates.unassignUsers) quest.assignedUserIds = quest.assignedUserIds.filter(id => !updates.unassignUsers.includes(id));
        }
    });
}));
app.post('/api/quests/delete-many', async (req, res) => handleApiAction(res, data => {
    const { questIds } = req.body;
    data.quests = data.quests.filter(q => !questIds.includes(q.id));
}));


// --- Other assets with similar CRUD patterns ---
['reward-types', 'markets', 'guilds', 'trophies', 'game-assets', 'scheduled-events', 'quest-groups'].forEach(asset => {
    const assetKey = asset.replace('-', '');
    const dataKey = assetKey === 'gameassets' ? 'gameAssets' : assetKey === 'questgroups' ? 'questGroups' : `${assetKey}`;
    
    app.post(`/api/${asset}`, async (req, res) => handleApiAction(res, data => {
        const newItem = {...req.body, id: `${asset}-${Date.now()}`};
        data[dataKey].push(newItem);
        if (asset === 'quest-groups') return { newGroup: newItem };
    }));
    app.put(`/api/${asset}/:id`, async (req, res) => handleApiAction(res, data => {
        const itemIndex = data[dataKey].findIndex(i => i.id === req.params.id);
        if (itemIndex === -1) throw { statusCode: 404, message: 'Item not found' };
        data[dataKey][itemIndex] = {...data[dataKey][itemIndex], ...req.body};
    }));
    app.delete(`/api/${asset}/:id`, async (req, res) => handleApiAction(res, data => {
        data[dataKey] = data[dataKey].filter(i => i.id !== req.params.id);
        if(asset === 'quest-groups') {
            data.quests.forEach(q => { if(q.groupId === req.params.id) q.groupId = undefined; });
        }
    }));
});

// --- Settings ---
app.put('/api/settings', async (req, res) => handleApiAction(res, data => {
    data.settings = { ...data.settings, ...req.body };
}));

// --- Chat ---
app.post('/api/chat/messages', async (req, res) => {
    try {
        const { senderId, recipientId, guildId, message, isAnnouncement } = req.body;
        const newMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            senderId, recipientId, guildId, message,
            timestamp: new Date().toISOString(),
            readBy: [senderId],
            isAnnouncement: isAnnouncement || undefined,
        };

        const query = `
            UPDATE app_data
            SET value = jsonb_set(
                value,
                '{chatMessages}',
                COALESCE(value->'chatMessages', '[]'::jsonb) || $1::jsonb,
                true
            )
            WHERE key = 'app_state';
        `;
        
        await pool.query(query, [JSON.stringify(newMessage)]);

        broadcast({ type: 'NEW_CHAT_MESSAGE', payload: newMessage });
        res.status(201).json(newMessage);
    } catch (err) {
        console.error("Chat message error:", err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
});

// ... The rest of the endpoints for backups, AI, media, etc. remain largely the same ...

app.get('/api/backups', async (req, res, next) => { try { const files = await fs.readdir(BACKUP_DIR); const backupDetails = await Promise.all( files .filter(file => file.endsWith('.json')) .map(async file => { const stats = await fs.stat(path.join(BACKUP_DIR, file)); return { filename: file, createdAt: stats.birthtime, size: stats.size, isAuto: file.startsWith('auto_backup_'), }; }) ); res.json(backupDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))); } catch (err) { if (err.code === 'ENOENT') { return res.json([]); } next(err); } });
app.post('/api/backups', async (req, res, next) => { try { const dataToBackup = JSON.stringify(req.body, null, 2); const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19); const filename = `manual_backup_${timestamp}.json`; await fs.writeFile(path.join(BACKUP_DIR, filename), dataToBackup); res.status(201).json({ message: 'Manual backup created successfully.' }); } catch (err) { next(err); } });
app.get('/api/backups/:filename', (req, res, next) => { const filename = path.basename(req.params.filename); const filePath = path.join(BACKUP_DIR, filename); res.download(filePath, (err) => { if (err) { if (err.code === "ENOENT") { return res.status(404).json({ error: "File not found." }); } return next(err); } }); });
app.delete('/api/backups/:filename', async (req, res, next) => { try { const filename = path.basename(req.params.filename); await fs.unlink(path.join(BACKUP_DIR, filename)); res.status(200).json({ message: 'Backup deleted successfully.' }); } catch (err) { if (err.code === "ENOENT") { return res.status(404).json({ error: "File not found." }); } next(err); } });
app.post('/api/media/upload', upload.single('file'), async (req, res, next) => { if (!req.file) return res.status(400).json({ error: 'No file uploaded.' }); try { let fileUrl; if (process.env.STORAGE_PROVIDER === 'supabase') { const category = req.body.category || 'Miscellaneous'; const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_ ]/g, '').trim(); const sanitizedFilename = req.file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_'); const filePath = sanitizedCategory ? `${sanitizedCategory}/${Date.now()}-${sanitizedFilename}` : `${Date.now()}-${sanitizedFilename}`; const { data, error } = await supabase.storage .from('media-assets') .upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false, }); if (error) throw error; const { data: { publicUrl } } = supabase.storage.from('media-assets').getPublicUrl(data.path); fileUrl = publicUrl; } else { const relativePath = path.relative(UPLOADS_DIR, req.file.path).replace(/\\/g, '/'); fileUrl = `/uploads/${relativePath}`; } res.status(201).json({ url: fileUrl, name: req.file.originalname, type: req.file.mimetype, size: req.file.size }); } catch (err) { next(err); } });
app.get('/api/media/local-gallery', async (req, res, next) => { if (process.env.STORAGE_PROVIDER !== 'local') { return res.status(200).json([]); } const walk = async (dir, parentCategory = null) => { let dirents; try { dirents = await fs.readdir(dir, { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') { await fs.mkdir(dir, { recursive: true }); return []; } throw e; } let imageFiles = []; for (const dirent of dirents) { const fullPath = path.join(dir, dirent.name); if (dirent.isDirectory()) { const nestedFiles = await walk(fullPath, dirent.name); imageFiles = imageFiles.concat(nestedFiles); } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(dirent.name)) { const relativePath = path.relative(UPLOADS_DIR, fullPath).replace(/\\/g, '/'); imageFiles.push({ url: `/uploads/${relativePath}`, category: parentCategory ? (parentCategory.charAt(0).toUpperCase() + parentCategory.slice(1)) : 'Miscellaneous', name: dirent.name.replace(/\.[^/.]+$/, ""), }); } } return imageFiles; }; try { const allImageFiles = await walk(UPLOADS_DIR); res.status(200).json(allImageFiles); } catch (err) { next(err); } });
app.post('/api/ai/test', async (req, res, next) => { if (!ai) { return res.status(400).json({ success: false, error: "AI features are not configured on the server. The API_KEY environment variable is not set." }); } try { const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' }); if (response && response.text) { res.json({ success: true }); } else { throw new Error("Received an empty or invalid response from the API."); } } catch (error) { console.error("AI API Key Test Failed:", error.message); res.status(400).json({ success: false, error: 'API key is invalid or permissions are insufficient.' }); } });
app.post('/api/ai/generate', async (req, res, next) => { if (!ai) return res.status(503).json({ error: "AI features are not configured on the server." }); const { model, prompt, generationConfig } = req.body; try { const response = await ai.models.generateContent({ model, contents: prompt, config: generationConfig, }); res.json({ text: response.text }); } catch (err) { next(err); } });

app.use(express.static(path.join(__dirname, '../dist')));
if (process.env.STORAGE_PROVIDER === 'local') { app.use('/uploads', express.static(UPLOADS_DIR)); }
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));
app.use((err, req, res, next) => { console.error('An error occurred:', err.stack); res.status(500).json({ error: 'Internal Server Error', message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, }); });

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    server.listen(port, () => {
        console.log(`Task Donegeon backend listening at http://localhost:${port}`);
    });
}

module.exports = app;