

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs').promises;
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');

// --- INITIAL DATA HELPERS (used for first run) ---
const { Role, QuestType, RewardCategory, QuestAvailability, TrophyRequirementType } = require(path.join(__dirname, 'types.js'));
const {
    INITIAL_QUEST_GROUPS,
    INITIAL_REWARD_TYPES,
    INITIAL_RANKS,
    INITIAL_THEMES,
    INITIAL_SETTINGS,
    INITIAL_TROPHIES,
    createSampleMarkets,
    createSampleGameAssets,
    createSampleQuests,
} = require(path.join(__dirname, 'initialData.js'));

const getGuidedSetupData = () => {
  // We pass an empty user array because the actual admin user will be added by the first-run handler.
  const sampleQuests = createSampleQuests([]);
  return {
    quests: sampleQuests,
    questGroups: INITIAL_QUEST_GROUPS,
    markets: createSampleMarkets(),
    rewardTypes: INITIAL_REWARD_TYPES,
    questCompletions: [],
    purchaseRequests: [],
    guilds: [{ id: 'guild-1', name: 'Primary Guild', purpose: 'The main guild.', memberIds: [], isDefault: true }],
    ranks: INITIAL_RANKS,
    trophies: INITIAL_TROPHIES,
    userTrophies: [],
    adminAdjustments: [],
    gameAssets: createSampleGameAssets(),
    systemLogs: [],
    settings: { ...INITIAL_SETTINGS, contentVersion: 2 },
    themes: INITIAL_THEMES,
    loginHistory: [],
    chatMessages: [],
    systemNotifications: [],
    scheduledEvents: [],
  };
};


// --- CONSTANTS ---
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const BACKUP_DIR = process.env.BACKUP_PATH || path.join(__dirname, 'backups');
const AI_MODEL = 'gemini-2.5-flash';
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'task-donegeon.db');

// --- DATABASE LOGIC ---
let db;

const initializeDb = () => {
  return new Promise(async (resolve, reject) => {
    try {
      await fs.mkdir(DB_DIR, { recursive: true });
      db = new sqlite3.Database(DB_PATH, async (err) => {
        if (err) {
          console.error("Error connecting to SQLite:", err);
          return reject(err);
        }
        console.log('Connected to the SQLite database.');
        // Use serialize to ensure sequential execution
        db.serialize(() => {
          db.run(`CREATE TABLE IF NOT EXISTS app_data (key TEXT PRIMARY KEY, value TEXT NOT NULL)`, (err) => {
            if (err) {
               console.error("Error creating table:", err);
              return reject(err);
            }
            console.log("Database table 'app_data' is ready.");
            resolve();
          });
        });
      });
    } catch (error) {
       console.error("Error during DB directory creation:", error);
      reject(error);
    }
  });
};

const loadData = async () => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error("Database is not initialized."));
    db.get("SELECT value FROM app_data WHERE key = ?", ['appState'], (err, row) => {
      if (err) {
        return reject(err);
      }
      if (!row) {
        console.log("No data found in DB. This is a first run.");
        return resolve({ users: [], settings: null });
      }
      try {
        resolve(JSON.parse(row.value));
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
};

const saveData = async (data) => {
  return new Promise((resolve, reject) => {
     if (!db) return reject(new Error("Database is not initialized."));
    const jsonData = JSON.stringify(data);
    db.run("INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?)", ['appState', jsonData], function(err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
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

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`); next(); });
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, '..', 'dist')));

// --- API ROUTES---

// --- DATA & FIRST RUN ---
app.get('/api/data', async (req, res) => {
  try {
    const data = await loadData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/first-run', async (req, res) => {
    try {
        const { adminUserData, setupChoice, blueprint } = req.body;
        let newData;
        if (setupChoice === 'scratch') {
            newData = { ...getGuidedSetupData(), quests: [], markets: [], gameAssets: [] };
        } else if (setupChoice === 'import' && blueprint) {
            newData = { ...getGuidedSetupData(), ...blueprint.assets };
        } else { // 'guided' is the default
            newData = getGuidedSetupData();
        }

        const adminId = `user-${Date.now()}`;
        const newAdmin = {
            ...adminUserData,
            id: adminId,
            avatar: {},
            ownedAssetIds: [],
            personalPurse: {},
            personalExperience: {},
            guildBalances: {},
            ownedThemes: ['emerald', 'rose', 'sky'],
            hasBeenOnboarded: false,
        };

        newData.users = [newAdmin];
        // Add new admin to the default guild
        if(newData.guilds && newData.guilds[0]) {
            newData.guilds[0].memberIds.push(adminId);
        }
        
        await saveData(newData);
        await broadcastUpdate();
        res.status(200).json({ user: newAdmin });
    } catch (error) {
        console.error("First run error:", error);
        res.status(500).json({ error: error.message });
    }
});


// --- GENERIC CRUD HELPER ---
const createCrudRoutes = (app, dataKey, idPrefix) => {
    // Add new item
    app.post(`/api/${dataKey}`, apiHandler((data, req) => {
        const newItem = { ...req.body, id: `${idPrefix}-${Date.now()}` };
        if(dataKey === 'users') { // Special handling for new users
            newItem.avatar = {};
            newItem.ownedAssetIds = [];
            newItem.personalPurse = {};
            newItem.personalExperience = {};
            newItem.guildBalances = {};
            newItem.ownedThemes = ['emerald', 'rose', 'sky'];
            newItem.hasBeenOnboarded = false;
        } else if (dataKey === 'gameAssets') {
             newItem.creatorId = req.body.creatorId || 'admin'; // Or get from auth later
             newItem.createdAt = new Date().toISOString();
             newItem.purchaseCount = 0;
        }
        data[dataKey] = [...(data[dataKey] || []), newItem];
        return { status: 201, body: newItem };
    }));

    // Update item
    app.put(`/api/${dataKey}/:id`, apiHandler((data, req) => {
        const { id } = req.params;
        data[dataKey] = data[dataKey].map(item => item.id === id ? { ...item, ...req.body } : item);
    }));

    // Delete item
    app.delete(`/api/${dataKey}/:id`, apiHandler((data, req) => {
        const { id } = req.params;
        data[dataKey] = data[dataKey].filter(item => item.id !== id);
    }));
};

createCrudRoutes(app, 'users', 'user');
createCrudRoutes(app, 'quests', 'quest');
createCrudRoutes(app, 'questGroups', 'qg');
createCrudRoutes(app, 'rewardTypes', 'rt');
createCrudRoutes(app, 'markets', 'mkt');
createCrudRoutes(app, 'guilds', 'gld');
createCrudRoutes(app, 'trophies', 't');
createCrudRoutes(app, 'gameAssets', 'ga');
createCrudRoutes(app, 'themes', 'thm');
createCrudRoutes(app, 'scheduledEvents', 'evt');
createCrudRoutes(app, 'systemNotifications', 'sn');

// --- COMPLEX ACTIONS ---

app.post('/api/quests/:id/complete', apiHandler((data, req) => {
    const { id } = req.params;
    const { userId, note, completionDate } = req.body;
    const quest = data.quests.find(q => q.id === id);
    if (!quest) return { status: 404, body: { error: "Quest not found" } };

    const newCompletion = {
        id: `qc-${Date.now()}`,
        questId: id,
        userId,
        completedAt: completionDate ? new Date(completionDate).toISOString() : new Date().toISOString(),
        status: quest.requiresApproval ? 'Pending' : 'Approved',
        note: note,
        guildId: quest.guildId
    };

    data.questCompletions.push(newCompletion);

    if (newCompletion.status === 'Approved') {
        // Apply rewards
        const user = data.users.find(u => u.id === userId);
        if (user) {
            let targetPurse, targetExperience;
            if (quest.guildId) {
                if (!user.guildBalances[quest.guildId]) user.guildBalances[quest.guildId] = { purse: {}, experience: {} };
                targetPurse = user.guildBalances[quest.guildId].purse;
                targetExperience = user.guildBalances[quest.guildId].experience;
            } else {
                targetPurse = user.personalPurse;
                targetExperience = user.personalExperience;
            }
            quest.rewards.forEach(reward => {
                const type = data.rewardTypes.find(rt => rt.id === reward.rewardTypeId)?.category;
                if (type === 'Currency') {
                    targetPurse[reward.rewardTypeId] = (targetPurse[reward.rewardTypeId] || 0) + reward.amount;
                } else if (type === 'XP') {
                    targetExperience[reward.rewardTypeId] = (targetExperience[reward.rewardTypeId] || 0) + reward.amount;
                }
            });
        }
    }
}));

app.post('/api/approvals/quest/:id/approve', apiHandler((data, req) => {
    const { id } = req.params;
    const { note } = req.body;
    const completion = data.questCompletions.find(c => c.id === id);
    if (!completion) return { status: 404, body: { error: 'Completion record not found' } };

    if (completion.status !== 'Pending') return { status: 400, body: { error: 'Quest is not pending approval.' } };

    completion.status = 'Approved';
    if (note) {
        completion.note = completion.note ? `${completion.note}\nApprover: ${note}` : `Approver: ${note}`;
    }

    const quest = data.quests.find(q => q.id === completion.questId);
    const user = data.users.find(u => u.id === completion.userId);
    if (quest && user) {
        // Apply rewards logic
        let targetPurse, targetExperience;
        if (quest.guildId) {
            if (!user.guildBalances[quest.guildId]) user.guildBalances[quest.guildId] = { purse: {}, experience: {} };
            targetPurse = user.guildBalances[quest.guildId].purse;
            targetExperience = user.guildBalances[quest.guildId].experience;
        } else {
            targetPurse = user.personalPurse;
            targetExperience = user.personalExperience;
        }
         quest.rewards.forEach(reward => {
            const typeDef = data.rewardTypes.find(rt => rt.id === reward.rewardTypeId);
            if (typeDef) {
              if (typeDef.category === 'Currency') {
                  targetPurse[reward.rewardTypeId] = (targetPurse[reward.rewardTypeId] || 0) + reward.amount;
              } else if (typeDef.category === 'XP') {
                  targetExperience[reward.rewardTypeId] = (targetExperience[reward.rewardTypeId] || 0) + reward.amount;
              }
            }
        });
    }
}));

app.post('/api/approvals/quest/:id/reject', apiHandler((data, req) => {
    const { id } = req.params;
    const { note } = req.body;
    const completion = data.questCompletions.find(c => c.id === id);
    if (!completion) return { status: 404, body: { error: 'Completion record not found' } };

    if (completion.status !== 'Pending') return { status: 400, body: { error: 'Quest is not pending approval.' } };

    completion.status = 'Rejected';
    if (note) {
        completion.note = completion.note ? `${completion.note}\nRejecter: ${note}` : `Rejecter: ${note}`;
    }
}));


app.post('/api/quests/:id/actions', apiHandler((data, req) => {
    const { id } = req.params;
    const { action, userId } = req.body;
    const quest = data.quests.find(q => q.id === id);
    if (!quest) return { status: 404, body: { error: 'Quest not found' } };

    if (!quest.todoUserIds) quest.todoUserIds = [];

    if (action === 'mark_todo') {
        if (!quest.todoUserIds.includes(userId)) quest.todoUserIds.push(userId);
    } else if (action === 'unmark_todo') {
        quest.todoUserIds = quest.todoUserIds.filter(uid => uid !== userId);
    }
}));


// --- CHAT ---
app.post('/api/chat/messages', apiHandler((data, req) => {
    const { senderId, recipientId, guildId, message, isAnnouncement } = req.body;
    const newMessage = {
        id: `msg-${Date.now()}`,
        senderId,
        recipientId,
        guildId,
        message,
        isAnnouncement,
        timestamp: new Date().toISOString(),
        readBy: [senderId],
    };
    data.chatMessages = [...(data.chatMessages || []), newMessage];
    broadcast({ type: 'NEW_CHAT_MESSAGE', payload: newMessage });
}));

app.post('/api/chat/read', apiHandler((data, req) => {
    const { userId, partnerId, guildId } = req.body;
    data.chatMessages.forEach(msg => {
        const isUnread = !msg.readBy.includes(userId);
        if (isUnread) {
            if (partnerId && ((msg.senderId === partnerId && msg.recipientId === userId) || (msg.senderId === userId && msg.recipientId === partnerId))) {
                msg.readBy.push(userId);
            }
            if (guildId && msg.guildId === guildId) {
                msg.readBy.push(userId);
            }
        }
    });
}));

// --- SETTINGS ---
app.put('/api/settings', apiHandler((data, req) => {
    data.settings = { ...data.settings, ...req.body };
}));


// --- MEDIA ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.body.category || 'miscellaneous';
        const dir = path.join(UPLOAD_DIR, category);
        fs.mkdir(dir, { recursive: true }).then(() => cb(null, dir)).catch(err => cb(err, dir));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

app.post('/api/media/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    const category = req.body.category || 'miscellaneous';
    const url = `/uploads/${category}/${req.file.filename}`;
    res.json({ url });
});

app.get('/api/media/local-gallery', async (req, res) => {
    try {
        const categories = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });
        let allImages = [];

        for (const category of categories) {
            if (category.isDirectory()) {
                const files = await fs.readdir(path.join(UPLOAD_DIR, category.name));
                files.forEach(file => {
                    allImages.push({
                        url: `/uploads/${category.name}/${file}`,
                        category: category.name,
                        name: file
                    });
                });
            }
        }
        res.json(allImages);
    } catch (error) {
        console.error("Error fetching local gallery:", error);
        res.status(500).json({ error: "Could not read image gallery." });
    }
});

// --- AI ---
let ai;
try {
    if (process.env.API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
} catch (e) { console.error("Could not initialize GoogleGenAI:", e.message); }

app.get('/api/ai/status', (req, res) => {
    res.json({ isConfigured: !!ai });
});

app.post('/api/ai/test', async (req, res) => {
    if (!ai) {
        return res.status(400).json({ success: false, error: 'API key not configured on the server.' });
    }
    try {
        // A simple test to see if we can instantiate the model
        await ai.models.generateContent({ model: AI_MODEL, contents: 'test' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/ai/generate', async (req, res) => {
    if (!ai) return res.status(503).json({ error: 'AI service is not configured.' });
    try {
        const { prompt, generationConfig, model } = req.body;
        const response = await ai.models.generateContent({
          model: model || AI_MODEL,
          contents: prompt,
          config: generationConfig,
        });
        res.json(response);
    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- ECONOMY ---
app.post('/api/economy/exchange', apiHandler((data, req) => {
    const { userId, payItem, receiveItem, guildId } = req.body;
    const user = data.users.find(u => u.id === userId);
    if (!user) return { status: 404, body: { error: 'User not found.' } };

    const payRewardDef = data.rewardTypes.find(rt => rt.id === payItem.rewardTypeId);
    if (!payRewardDef) return { status: 400, body: { error: 'Paying reward type not found.' } };

    let targetPayBalance;
    if (guildId) {
        if (!user.guildBalances[guildId]) user.guildBalances[guildId] = { purse: {}, experience: {} };
        targetPayBalance = payRewardDef.category === 'Currency' ? user.guildBalances[guildId].purse : user.guildBalances[guildId].experience;
    } else {
        targetPayBalance = payRewardDef.category === 'Currency' ? user.personalPurse : user.personalExperience;
    }
    
    if ((targetPayBalance[payItem.rewardTypeId] || 0) < payItem.amount) {
        return { status: 400, body: { error: 'Insufficient funds.' } };
    }
    targetPayBalance[payItem.rewardTypeId] -= payItem.amount;
    
    // Add receive item
    const receiveRewardDef = data.rewardTypes.find(rt => rt.id === receiveItem.rewardTypeId);
    if (!receiveRewardDef) return { status: 400, body: { error: 'Receiving reward type not found.' } };
    
     let targetReceiveBalance;
    if (guildId) {
        if (!user.guildBalances[guildId]) user.guildBalances[guildId] = { purse: {}, experience: {} };
        targetReceiveBalance = receiveRewardDef.category === 'Currency' ? user.guildBalances[guildId].purse : user.guildBalances[guildId].experience;
    } else {
        targetReceiveBalance = receiveRewardDef.category === 'Currency' ? user.personalPurse : user.personalExperience;
    }
    targetReceiveBalance[receiveItem.rewardTypeId] = (targetReceiveBalance[receiveItem.rewardTypeId] || 0) + receiveItem.amount;

}));


// Fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// --- SERVER START ---
const PORT = process.env.PORT || 3001;
initializeDb().then(() => {
    initWebSocket(server);
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}).catch(err => {
    console.error("Failed to initialize server:", err);
    process.exit(1);
});