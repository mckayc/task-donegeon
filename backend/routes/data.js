
const express = require('express');
const { dataSource } = require('../data-source');
const { allEntities, SettingEntity, LoginHistoryEntity } = require('../entities');
const { INITIAL_SETTINGS } = require('../initialData');


const entityToKeyMap = {
    User: 'users',
    Quest: 'quests',
    QuestGroup: 'questGroups',
    Market: 'markets',
    RewardTypeDefinition: 'rewardTypes',
    QuestCompletion: 'questCompletions',
    PurchaseRequest: 'purchaseRequests',
    Guild: 'guilds',
    Rank: 'ranks',
    Trophy: 'trophies',
    UserTrophy: 'userTrophies',
    AdminAdjustment: 'adminAdjustments',
    GameAsset: 'gameAssets',
    SystemLog: 'systemLogs',
    ThemeDefinition: 'themes',
    ChatMessage: 'chatMessages',
    SystemNotification: 'systemNotifications',
    ScheduledEvent: 'scheduledEvents',
    BugReport: 'bugReports',
    SetbackDefinition: 'setbackDefinitions',
    AppliedSetback: 'appliedSetbacks',
    Rotation: 'rotations',
    TradeOffer: 'tradeOffers',
    Gift: 'gifts',
};


module.exports = (updateEmitter) => {
    const router = express.Router();
    let clients = [];
    let lastKnownSyncTimestamp = new Date().toISOString();

    const fetchAllData = async () => {
        const data = {};
        const entitiesToFetch = allEntities.filter(e => e.name in entityToKeyMap);

        for (const entitySchema of entitiesToFetch) {
            const key = entityToKeyMap[entitySchema.name];
            // This check is now slightly redundant due to the filter above, but it's good for safety.
            if (key) {
                const repo = dataSource.getRepository(entitySchema.target);
                data[key] = await repo.find();
            } else {
                // This block should no longer be reached by standard entities.
                console.warn(`No key mapping found for entity: ${entitySchema.name}`);
            }
        }
        
        // Special handling for single-row entities
        const settingsRepo = dataSource.getRepository(SettingEntity);
        const settingsResult = await settingsRepo.findOneBy({ id: 1 });
        data.settings = settingsResult ? settingsResult.settings : INITIAL_SETTINGS;

        const loginHistoryRepo = dataSource.getRepository(LoginHistoryEntity);
        const loginHistoryResult = await loginHistoryRepo.findOneBy({ id: 1 });
        data.loginHistory = loginHistoryResult ? loginHistoryResult.history : [];
        
        // Check if AI is configured
        data.isAiConfigured = !!(process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall');

        return data;
    };

    router.get('/sync', async (req, res) => {
        try {
            const data = await fetchAllData();
            lastKnownSyncTimestamp = new Date().toISOString(); // Update timestamp on each full sync
            res.json({ updates: data, newSyncTimestamp: lastKnownSyncTimestamp });
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
            res.status(500).json({ error: 'Failed to fetch initial data.' });
        }
    });

    router.get('/events', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const clientId = Date.now();
        clients.push({ id: clientId, res });

        const syncHandler = () => {
            clients.forEach(client => client.res.write('data: sync\n\n'));
        };

        updateEmitter.on('update', syncHandler);

        req.on('close', () => {
            clients = clients.filter(c => c.id !== clientId);
            updateEmitter.removeListener('update', syncHandler);
        });
    });

    // --- DANGER ZONE ROUTES ---
    router.post('/factory-reset', async (req, res) => {
        try {
            for (const entity of allEntities) {
                await dataSource.getRepository(entity.target).clear();
            }
            await dataSource.getRepository(SettingEntity).clear();
            await dataSource.getRepository(LoginHistoryEntity).clear();
            updateEmitter.emit('update');
            res.status(204).send();
        } catch(e) {
            res.status(500).json({ error: 'Factory reset failed.' });
        }
    });

    return router;
};
