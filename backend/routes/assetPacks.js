
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const ASSET_PACKS_DIR = '/app/data/asset_packs';

const router = express.Router();

// Discover local asset packs
router.get('/discover', async (req, res) => {
    try {
        const files = await fs.readdir(ASSET_PACKS_DIR);
        const packs = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(ASSET_PACKS_DIR, file), 'utf-8');
                const packData = JSON.parse(content);
                // Simple summary logic
                const summary = {
                    quests: (packData.assets.quests || []).slice(0, 3).map((q) => ({ title: q.title, icon: q.icon })),
                    gameAssets: (packData.assets.gameAssets || []).slice(0, 3).map((a) => ({ name: a.name, icon: a.icon })),
                };
                packs.push({ manifest: packData.manifest, filename: file, summary });
            }
        }
        res.json(packs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to discover asset packs.' });
    }
});

// Get a specific local asset pack
router.get('/get/:filename', async (req, res) => {
    try {
        const filename = path.basename(req.params.filename); // Sanitize
        const filePath = path.join(ASSET_PACKS_DIR, filename);
        res.sendFile(filePath);
    } catch (error) {
        res.status(404).json({ error: 'Asset pack not found.' });
    }
});

// Fetch a remote asset pack
router.get('/fetch-remote', async (req, res) => {
    try {
        const { url } = req.query;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch remote asset pack.');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch remote asset pack.' });
    }
});

module.exports = router;
