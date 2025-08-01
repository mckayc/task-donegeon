import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

import { createInitialData, createInitialQuestCompletions } from './data/initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

// --- CORS Configuration ---
// This is the critical fix for the "xhr poll error".
// It allows the frontend (on a different origin) to connect to the Socket.IO server.
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development simplicity
    methods: ["GET", "POST"]
  }
});

app.use(cors()); // Use cors for all Express routes
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Helper Functions ---
const getFullState = async () => {
    const appState = await prisma.appState.findUnique({ where: { id: 1 } });
    if (!appState) return null;

    const data = {
        users: await prisma.user.findMany(),
        quests: await prisma.quest.findMany(),
        questGroups: await prisma.questGroup.findMany(),
        markets: await prisma.market.findMany(),
        rewardTypes: await prisma.rewardTypeDefinition.findMany(),
        questCompletions: await prisma.questCompletion.findMany(),
        purchaseRequests: await prisma.purchaseRequest.findMany(),
        guilds: await prisma.guild.findMany(),
        ranks: await prisma.rank.findMany(),
        trophies: await prisma.trophy.findMany(),
        userTrophies: await prisma.userTrophy.findMany(),
        adminAdjustments: await prisma.adminAdjustment.findMany(),
        gameAssets: await prisma.gameAsset.findMany(),
        systemLogs: await prisma.systemLog.findMany(),
        themes: await prisma.themeDefinition.findMany(),
        chatMessages: await prisma.chatMessage.findMany({ orderBy: { timestamp: 'asc' } }),
        systemNotifications: await prisma.systemNotification.findMany(),
        scheduledEvents: await prisma.scheduledEvent.findMany(),
        settings: appState.settings,
        loginHistory: appState.loginHistory,
    };
    return data;
};

const emitFullStateUpdate = async (socketOrIo) => {
    try {
        const state = await getFullState();
        if (state) {
            socketOrIo.emit('full-state-update', state);
        }
    } catch (error) {
        console.error("Failed to get and emit full state:", error);
    }
};

// Generic CRUD factory
const createCrudEndpoints = (modelName, pluralName) => {
    const model = prisma[modelName];
    const router = express.Router();

    router.post('/', async (req, res) => {
        try {
            const newItem = await model.create({ data: req.body });
            await emitFullStateUpdate(io);
            res.status(201).json(newItem);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const updatedItem = await model.update({ where: { id: req.params.id }, data: req.body });
            await emitFullStateUpdate(io);
            res.json(updatedItem);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await model.delete({ where: { id: req.params.id } });
            await emitFullStateUpdate(io);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    return router;
};


// --- API Routes ---

app.get('/api/data', async (req, res) => {
    try {
        let state = await getFullState();
        if (!state) {
            // First run, seed the database
            const initialData = createInitialData('guided');
            const { settings, loginHistory, ...relationalData } = initialData;

            // This is a simplified seeding process. A real one would use transactions.
            await prisma.appState.create({ data: { id: 1, settings, loginHistory } });
            for (const user of relationalData.users) await prisma.user.create({ data: user });
            for (const item of relationalData.rewardTypes) await prisma.rewardTypeDefinition.create({ data: item });
            for (const item of relationalData.ranks) await prisma.rank.create({ data: item });
            for (const item of relationalData.themes) await prisma.themeDefinition.create({ data: item });
            for (const item of relationalData.guilds) await prisma.guild.create({ data: item });
            for (const item of relationalData.trophies) await prisma.trophy.create({ data: item });
            for (const item of relationalData.markets) await prisma.market.create({ data: item });
            for (const item of relationalData.questGroups) await prisma.questGroup.create({ data: item });
            for (const item of relationalData.quests) await prisma.quest.create({ data: item });
            for (const item of relationalData.gameAssets) await prisma.gameAsset.create({ data: item });
            
            state = await getFullState();
        }
        res.json(state);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: 'Failed to retrieve application data.' });
    }
});


app.post('/api/first-run', async (req, res) => {
    const { adminUserData, setupChoice, blueprint } = req.body;
    try {
        const { password, ...userData } = adminUserData;
        const adminUser = { ...userData, id: `user-${Date.now()}` };

        const initialData = createInitialData(setupChoice, adminUser, blueprint);
        const { settings, loginHistory, ...relationalData } = initialData;

        // Clear existing data
        await prisma.appState.deleteMany();
        // Simplified clearing, proper way would be cascading deletes
        const modelNames = Object.keys(prisma).filter(k => !k.startsWith('_') && k !== '$transaction');
        for (const modelName of modelNames) {
            if (prisma[modelName].deleteMany) {
                try {
                  await prisma[modelName].deleteMany();
                } catch (e) {
                   // Ignore errors on models that can't be deleted (e.g. if they don't exist yet)
                }
            }
        }
        
        await prisma.appState.create({ data: { id: 1, settings, loginHistory } });
        for (const user of relationalData.users) await prisma.user.create({ data: { ...user, password } });
        for (const item of relationalData.rewardTypes) await prisma.rewardTypeDefinition.create({ data: item });
        for (const item of relationalData.ranks) await prisma.rank.create({ data: item });
        for (const item of relationalData.themes) await prisma.themeDefinition.create({ data: item });
        for (const item of relationalData.guilds) await prisma.guild.create({ data: item });
        for (const item of relationalData.trophies) await prisma.trophy.create({ data: item });
        for (const item of relationalData.markets) await prisma.market.create({ data: item });
        for (const item of relationalData.questGroups) await prisma.questGroup.create({ data: item });
        for (const item of relationalData.quests) await prisma.quest.create({ data: item });
        for (const item of relationalData.gameAssets) await prisma.gameAsset.create({ data: item });

        const createdAdmin = await prisma.user.findFirst({ where: { role: 'Donegeon Master' } });

        await emitFullStateUpdate(io);
        res.status(201).json({ message: 'Setup complete!', adminUser: createdAdmin });
    } catch (error) {
        console.error("First run error:", error);
        res.status(500).json({ error: error.message });
    }
});


app.put('/api/settings', async (req, res) => {
    try {
        const currentAppState = await prisma.appState.findUnique({ where: { id: 1 } });
        const newSettings = { ...currentAppState.settings, ...req.body };
        await prisma.appState.update({
            where: { id: 1 },
            data: { settings: newSettings }
        });
        await emitFullStateUpdate(io);
        res.status(200).json({ message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});


app.post('/api/quests/:id/complete', async (req, res) => {
    const { questId } = req.params;
    const { userId, guildId, options } = req.body;
    try {
        const quest = await prisma.quest.findUnique({ where: { id: questId } });
        if (!quest) return res.status(404).json({ error: 'Quest not found' });
        
        const completion = await prisma.questCompletion.create({
            data: {
                questId,
                userId,
                guildId,
                completedAt: options?.completionDate ? new Date(options.completionDate).toISOString() : new Date().toISOString(),
                status: quest.requiresApproval ? 'Pending' : 'Approved',
                note: options?.note,
            }
        });

        // If not requiring approval, grant rewards immediately
        if (!quest.requiresApproval) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                const rewards = quest.rewards;
                const rewardTypes = await prisma.rewardTypeDefinition.findMany();
                // This is a simplified reward application. A real app would have more robust logic.
                for (const reward of rewards) {
                    const type = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                    if (!type) continue;
                    if (guildId) {
                        const balances = user.guildBalances[guildId] || { purse: {}, experience: {} };
                        if (type.category === 'Currency') {
                            balances.purse[reward.rewardTypeId] = (balances.purse[reward.rewardTypeId] || 0) + reward.amount;
                        } else {
                            balances.experience[reward.rewardTypeId] = (balances.experience[reward.rewardTypeId] || 0) + reward.amount;
                        }
                        user.guildBalances[guildId] = balances;
                    } else {
                        if (type.category === 'Currency') {
                            user.personalPurse[reward.rewardTypeId] = (user.personalPurse[reward.rewardTypeId] || 0) + reward.amount;
                        } else {
                            user.personalExperience[reward.rewardTypeId] = (user.personalExperience[reward.rewardTypeId] || 0) + reward.amount;
                        }
                    }
                }
                await prisma.user.update({ where: { id: userId }, data: { personalPurse: user.personalPurse, personalExperience: user.personalExperience, guildBalances: user.guildBalances } });
            }
        }
        
        await emitFullStateUpdate(io);
        res.status(201).json(completion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- AI Endpoints ---
app.get('/api/ai/status', (req, res) => {
    res.json({ isConfigured: !!process.env.API_KEY });
});

app.post('/api/ai/test', async (req, res) => {
    if (!process.env.API_KEY) {
        return res.status(400).json({ success: false, error: "API_KEY environment variable not set on the server." });
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        // A simple, non-streaming test call
        await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "test" });
        res.json({ success: true, message: "API key is valid." });
    } catch (error) {
        res.status(500).json({ success: false, error: "API key test failed. The key might be invalid or there could be a network issue." });
    }
});

app.post('/api/ai/generate', async (req, res) => {
    if (!process.env.API_KEY) {
        return res.status(400).json({ error: "API key not configured on server." });
    }
    try {
        const { model, prompt, generationConfig } = req.body;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({ model, contents: prompt, config: generationConfig });
        res.json(response);
    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: error.message || "An error occurred during AI generation." });
    }
});


// --- Basic CRUD Routes ---
app.use('/api/users', createCrudEndpoints('user', 'users'));
app.use('/api/quests', createCrudEndpoints('quest', 'quests'));
app.use('/api/quest-groups', createCrudEndpoints('questGroup', 'questGroups'));
app.use('/api/markets', createCrudEndpoints('market', 'markets'));
app.use('/api/reward-types', createCrudEndpoints('rewardTypeDefinition', 'rewardTypes'));
app.use('/api/trophies', createCrudEndpoints('trophy', 'trophies'));
app.use('/api/game-assets', createCrudEndpoints('gameAsset', 'gameAssets'));
app.use('/api/themes', createCrudEndpoints('themeDefinition', 'themes'));
// ... etc for other simple models


// --- Socket.IO Logic ---
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);
  
  socket.on('chat:message:send', async (newMessage) => {
    try {
      const savedMessage = await prisma.chatMessage.create({
        data: {
          senderId: newMessage.senderId,
          recipientId: newMessage.recipientId,
          guildId: newMessage.guildId,
          message: newMessage.message,
          isAnnouncement: newMessage.isAnnouncement,
          readBy: [newMessage.senderId],
        }
      });
      // Broadcast the new message to everyone. A real app would target specific users/rooms.
      await emitFullStateUpdate(io);
    } catch (error) {
      console.error("Failed to save chat message:", error);
      socket.emit('chat:message:error', { error: 'Failed to send message.' });
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

// --- Server Startup ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
