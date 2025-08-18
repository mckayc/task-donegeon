
const express = require('express');
const { dataSource } = require('../data-source');
const { allEntities, SettingEntity, LoginHistoryEntity } = require('../entities');

module.exports = (updateEmitter) => {
    const router = express.Router();
    let clients = [];
    let lastKnownSyncTimestamp = new Date().toISOString();

    const fetchAllData = async () => {
        const data = {};
        for(const entitySchema of allEntities) {
            const repo = dataSource.getRepository(entitySchema.target);
            const tableName = repo.metadata.tableName;
            data[tableName] = await repo.find();
        }
        // Special handling for single-row entities
        const settingsRepo = dataSource.getRepository(SettingEntity);
        const settings = await settingsRepo.findOneBy({ id: 1 });
        data.settings = settings ? settings.settings : null;

        const loginHistoryRepo = dataSource.getRepository(LoginHistoryEntity);
        const loginHistory = await loginHistoryRepo.findOneBy({ id: 1 });
        data.loginHistory = loginHistory ? loginHistory.history : [];
        
        return data;
    };

    router.get('/sync', async (req, res) => {
        try {
            const data = await fetchAllData();
            res.json({ updates: data, newSyncTimestamp: lastKnownSyncTimestamp });
        } catch (error) {
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

    // ... Other data-related routes like resets ...
    router.post('/factory-reset', async (req, res) => { /* ... */ updateEmitter.emit('update'); res.status(204).send(); });

    return router;
};
