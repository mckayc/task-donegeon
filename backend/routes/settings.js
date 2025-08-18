
const express = require('express');
const { dataSource } = require('../data-source');
const { SettingEntity } = require('../entities');
const { updateTimestamps } = require('../utils');


module.exports = (updateEmitter) => {
    const router = express.Router();

    router.put('/', async (req, res) => {
        try {
            const repo = dataSource.getRepository(SettingEntity);
            let settings = await repo.findOneBy({ id: 1 });
            
            if (!settings) {
                // If no settings exist, create a new entry.
                settings = repo.create({ id: 1, settings: req.body });
                updateTimestamps(settings, true);
            } else {
                // Otherwise, update the existing entry.
                settings.settings = req.body;
                updateTimestamps(settings);
            }
            
            const saved = await repo.save(settings);
            updateEmitter.emit('update');
            res.json(saved.settings);
        } catch (error) {
            console.error("Failed to save settings:", error);
            res.status(500).json({ error: "Failed to save settings." });
        }
    });

    return router;
};

// Add a simple utils file for shared functions like timestamping
const fs = require('fs');
const utilPath = require('path').join(__dirname, '../utils.js');
if (!fs.existsSync(utilPath)) {
    fs.writeFileSync(utilPath, `
const updateTimestamps = (entity, isNew = false) => {
    const now = new Date().toISOString();
    if (isNew) entity.createdAt = now;
    entity.updatedAt = now;
    return entity;
};
module.exports = { updateTimestamps };
`);
}
