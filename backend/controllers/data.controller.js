
const { updateEmitter } = require('../utils/updateEmitter');
const systemService = require('../services/system.service');
const { asyncMiddleware } = require('../utils/helpers');

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
        }
    });
};

updateEmitter.on('update', sendUpdateToClients);

// === Data Syncing & First Run ===

const syncData = async (req, res) => {
    const { lastSync } = req.query;
    const result = await systemService.syncData(lastSync);
    res.status(200).json(result);
};

const firstRun = async (req, res) => {
    const { adminUserData } = req.body;
    await systemService.firstRun(adminUserData);
    res.status(201).json({ message: 'First run setup complete.' });
};

const applyUpdates = async (req, res) => {
    await systemService.applySettingsUpdates();
    res.status(204).send();
};

const clearHistory = async (req, res) => {
    await systemService.clearAllHistory();
    res.status(204).send();
};

const resetPlayers = async (req, res) => {
    const { includeAdmins } = req.body;
    await systemService.resetAllPlayerData(includeAdmins === true);
    res.status(204).send();
};

const deleteContent = async (req, res) => {
    await systemService.deleteAllCustomContent();
    res.status(204).send();
};

const factoryReset = async (req, res) => {
    await systemService.factoryReset();
    res.status(204).send();
};

const getChronicles = async (req, res) => {
    const result = await systemService.getChronicles(req.query);
    res.json(result);
};

const resetSettings = async (req, res) => {
    await systemService.resetSettings();
    res.status(204).send();
};

const importAssets = async (req, res) => {
    const { assetPack, resolutions } = req.body;
    await systemService.importAssetPack(assetPack, resolutions);
    res.status(204).send();
};

module.exports = {
    handleSse,
    syncData: asyncMiddleware(syncData),
    firstRun: asyncMiddleware(firstRun),
    applyUpdates: asyncMiddleware(applyUpdates),
    clearHistory: asyncMiddleware(clearHistory),
    resetPlayers: asyncMiddleware(resetPlayers),
    deleteContent: asyncMiddleware(deleteContent),
    factoryReset: asyncMiddleware(factoryReset),
    getChronicles: asyncMiddleware(getChronicles),
    resetSettings: asyncMiddleware(resetSettings),
    importAssets: asyncMiddleware(importAssets),
};
