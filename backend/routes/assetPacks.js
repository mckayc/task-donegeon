
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const ASSET_PACKS_DIR = '/app/data/asset_packs';

const router = express.Router();

const getAssetSummary = (packData) => {
    const assets = packData.assets || {};
    return {
        quests: (assets.quests || []).slice(0, 3).map(q => ({ title: q.title, icon: q.icon })),
        gameAssets: (assets.gameAssets || []).slice(0, 3).map(a => ({ name: a.name, icon: a.icon })),
        trophies: (assets.trophies || []).slice(0, 3).map(t => ({ name: t.name, icon: t.icon })),
        users: (assets.users || []).slice(0, 3).map(u => ({ gameName: u.gameName, role: u.role })),
        markets: (assets.markets || []).slice(0, 3).map(m => ({ title: m.title, icon: m.icon })),
        ranks: (assets.ranks || []).slice(0, 3).map(r => ({ name: r.name, icon: r.icon })),
        rewardTypes: (assets.rewardTypes || []).slice(0, 3).map(rt => ({ name: rt.name, icon: rt.icon })),
        questGroups: (assets.questGroups || []).slice(0, 3).map(qg => ({ name: qg.name, icon: qg.icon })),
    };
};

router.get('/discover', async (req, res) => {
    try {
        const files = await fs.readdir(ASSET_PACKS_DIR);
        const packs = [];
        for (const file of files) {
            if (path.extname(file).toLowerCase() === '.json') {
                try {
                    const content = await fs.readFile(path.join(ASSET_PACKS_DIR, file), 'utf-8');
                    const packData = JSON.parse(content);
                    if (packData.manifest) {
                        packs.push({
                            manifest: packData.manifest,
                            filename: file,
                            summary: getAssetSummary(packData)
                        });
                    }
                } catch (parseError) {
                    console.error(`Could not parse asset pack ${file}:`, parseError);
                }
            }
        }
        res.json(packs);
    } catch (error) {
        console.error('Failed to discover asset packs:', error);
        res.status(500).json({ error: 'Failed to discover asset packs. The directory might be missing.' });
    }
});

router.get('/get/:filename', async (req, res) => {
    try {
        const filename = path.basename(req.params.filename); // Sanitize to prevent directory traversal
        if (path.extname(filename).toLowerCase() !== '.json') {
            return res.status(400).json({ error: 'Invalid file type requested.' });
        }
        const filePath = path.join(ASSET_PACKS_DIR, filename);
        
        // Check if file exists before sending
        await fs.access(filePath);
        res.sendFile(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'Asset pack not found.' });
        } else {
            console.error('Error getting asset pack:', error);
            res.status(500).json({ error: 'Could not retrieve asset pack.' });
        }
    }
});

router.get('/fetch-remote', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url || !url.startsWith('http')) {
            return res.status(400).json({ error: 'Invalid URL provided.' });
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch from remote URL with status ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch remote asset pack:', error);
        res.status(500).json({ error: 'Failed to fetch or parse the remote asset pack.' });
    }
});

module.exports = router;
