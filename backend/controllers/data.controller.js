

const { dataSource } = require('../data-source');
const { In, MoreThan } = require("typeorm");
const { 
    UserEntity
} = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { getFullAppData } = require('../utils/helpers');
const { INITIAL_SETTINGS } = require('../initialData');
const systemService = require('../services/system.service');


// === Server-Sent Events Logic ===
let clients = [];

const handleSse = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);
    console.log(`[SSE] Client connected: ${clientId}`);

    res.write('data: connected\n\n');

    const heartbeatInterval = setInterval(() => {
        try {
            res.write(': heartbeat\n\n');
        } catch (error) {
            console.error(`[SSE] Error writing heartbeat to client ${clientId}, closing connection.`);
            clearInterval(heartbeatInterval);
            req.socket.end();
        }
    }, 20000);

    req.on('close', () => {
        clearInterval(heartbeatInterval);
        console.log(`[SSE] Client disconnected: ${clientId}`);
        clients = clients.filter(client => client.id !== clientId);
    });
};

const sendUpdateToClients = () => {
    console.log(`[SSE] Broadcasting sync event to ${clients.length} client(s).`);
    clients.forEach(client => {
        try {
            client.res.write('data: sync\n\n');
        } catch (error) {
            console.error(`[SSE] Error writing to client ${client.id}:`, error.message);
            // The 'close' event on req will handle cleanup.
        }
    });
};

updateEmitter.on('update', sendUpdateToClients);

// === Data Syncing & First Run ===

const getDeltaAppData = async (manager, lastSync) => {
    const updates = {};
    const entityMap = {
        QuestGroup: 'questGroups', QuestCompletion: 'questCompletions', Rotation: 'rotations',
        Market: 'markets', GameAsset: 'gameAssets', PurchaseRequest: 'purchaseRequests', RewardTypeDefinition: 'rewardTypes', TradeOffer: 'tradeOffers', Gift: 'gifts',
        Rank: 'ranks', Trophy: 'trophies', UserTrophy: 'userTrophies', Guild: 'guilds',
        SystemLog: 'systemLogs', AdminAdjustment: 'adminAdjustments', SystemNotification: 'systemNotifications', ScheduledEvent: 'scheduledEvents', ChatMessage: 'chatMessages',
        BugReport: 'bugReports', ModifierDefinition: 'modifierDefinitions', AppliedModifier: 'appliedModifiers', ThemeDefinition: 'themes'
    };

    // User sync is special because of relations
    const updatedUsers = await manager.find('User', { where: { updatedAt: MoreThan(lastSync) }, relations: ['guilds'] });
    if (updatedUsers.length > 0) {
        updates.users = updatedUsers.map(u => {
            const { guilds, ...userData } = u;
            return { ...userData, guildIds: guilds.map(g => g.id) };
        });
    }

    // Quest sync is also special because of relations
    const updatedQuests = await manager.find('Quest', { where: { updatedAt: MoreThan(lastSync) }, relations: ['assignedUsers'] });
     if (updatedQuests.length > 0) {
        updates.quests = updatedQuests.map(q => {
            const { assignedUsers, ...questData } = q;
            return { ...questData, assignedUserIds: assignedUsers.map(u => u.id) };
        });
    }
    
    for (const entityName in entityMap) {
        const repo = manager.getRepository(entityName);
        const keyName = entityMap[entityName];
        
        if (repo.metadata.hasColumnWithPropertyPath('updatedAt')) {
            const changedItems = await repo.find({ where: { updatedAt: MoreThan(lastSync) } });
            if (changedItems.length > 0) {
                updates[keyName] = changedItems;
            }
        }
    }

    const settingRow = await manager.findOne('Setting', { where: { id: 1, updatedAt: MoreThan(lastSync) } });
    if (settingRow) updates.settings = settingRow.settings;

    const historyRow = await manager.findOne('LoginHistory', { where: { id: 1, updatedAt: MoreThan(lastSync) } });
    if (historyRow) updates.loginHistory = historyRow.history;

    return updates;
};

const syncData = async (req, res) => {
    const { lastSync } = req.query;
    const newSyncTimestamp = new Date().toISOString();
    const manager = dataSource.manager;

    if (!lastSync) {
        // Full initial load
        const userCount = await manager.count(UserEntity);
        if (userCount === 0) {
            console.log("No users found, triggering first run.");
            return res.status(200).json({
                updates: { settings: INITIAL_SETTINGS, users: [], loginHistory: [] },
                newSyncTimestamp
            });
        }
        console.log("[Sync] Performing full initial data load for client.");
        const appData = await getFullAppData(manager);
        res.status(200).json({ updates: appData, newSyncTimestamp });
    } else {
        // Delta sync
        console.log(`[Sync] Performing delta sync for client since ${lastSync}`);
        const updates = await getDeltaAppData(manager, lastSync);
        res.status(200).json({ updates, newSyncTimestamp });
    }
};

const firstRun = async (req, res) => {
    // This is now handled by the data controller and its firstRun service.
    // For now, keep the old logic but this should be refactored.
    const { firstRun } = require('../services/system.service');
    await firstRun(req, res);
};

const applyUpdates = async (req, res) => {
    const { applySettingsUpdates } = require('../services/system.service');
    await applySettingsUpdates(req, res);
};

const clearHistory = async (req, res) => {
    const { clearAllHistory } = require('../services/system.service');
    await clearAllHistory(req, res);
};

const resetPlayers = async (req, res) => {
    const { resetAllPlayerData } = require('../services/system.service');
    await resetAllPlayerData(req, res);
};

const deleteContent = async (req, res) => {
    const { deleteAllCustomContent } = require('../services/system.service');
    await deleteAllCustomContent(req, res);
};

const factoryReset = async (req, res) => {
    const { factoryReset } = require('../services/system.service');
    await factoryReset(req, res);
};

const getChronicles = async (req, res) => {
    await systemService.getChronicles(req, res);
};

module.exports = {
    handleSse,
    syncData,
    firstRun,
    applyUpdates,
    clearHistory,
    resetPlayers,
    deleteContent,
    factoryReset,
    getChronicles,
};