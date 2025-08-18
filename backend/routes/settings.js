
const express = require('express');
const { dataSource } = require('../data-source');
const { SettingEntity } = require('../entities');

module.exports = (updateEmitter) => {
    const router = express.Router();

    router.put('/', async (req, res) => {
        try {
            const repo = dataSource.getRepository(SettingEntity);
            let settings = await repo.findOneBy({ id: 1 });
            if (!settings) {
                settings = repo.create({ id: 1, settings: req.body });
            } else {
                settings.settings = req.body;
            }
            const saved = await repo.save(settings);
            updateEmitter.emit('update');
            res.json(saved.settings);
        } catch (error) {
            res.status(500).json({ error: "Failed to save settings." });
        }
    });

    return router;
};
