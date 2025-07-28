
const express = require('express');
const handleRequest = require('../utils/requestHandler');
const { loadData } = require('../db');
const router = express.Router();

router.get('/pre-run-check', async (req, res) => {
    try {
        const data = await loadData();
        if (data && data.users && data.users.length > 0) {
            res.json({
                dataExists: true,
                version: data.settings.contentVersion || 1,
                appName: data.settings.terminology.appName || 'Task Donegeon'
            });
        } else {
            res.json({ dataExists: false });
        }
    } catch (error) {
        res.json({ dataExists: false });
    }
});

router.post('/first-run', handleRequest((data, req) => {
    const { adminUserData, setupChoice, blueprint } = req.body;
    if (data.users.length > 0) throw new Error('First run has already been completed.');
    
    const { createMockUsers, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, createSampleMarkets, createSampleQuests, createInitialGuilds, createSampleGameAssets, INITIAL_THEMES, INITIAL_QUEST_GROUPS } = require('../initialData');

    const adminUser = {
        ...adminUserData, id: `user-1`, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
        guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: true,
    };

    if (setupChoice === 'guided') {
        const mockUsers = createMockUsers();
        const fullAdmin = { ...mockUsers.find(u => u.username === 'admin'), ...adminUser };
        data.users = [
            fullAdmin,
            mockUsers.find(u => u.username === 'explorer'),
            mockUsers.find(u => u.username === 'gatekeeper')
        ];
        data.rewardTypes = INITIAL_REWARD_TYPES;
        data.ranks = INITIAL_RANKS;
        data.trophies = INITIAL_TROPHIES;
        data.markets = createSampleMarkets();
        data.quests = createSampleQuests(data.users);
        data.guilds = createInitialGuilds(data.users);
        data.gameAssets = createSampleGameAssets();
        data.themes = INITIAL_THEMES;
        data.questGroups = INITIAL_QUEST_GROUPS;
    } else { // scratch or import
        data.users.push(adminUser);
        data.rewardTypes = INITIAL_REWARD_TYPES;
        data.ranks = INITIAL_RANKS;
        data.themes = INITIAL_THEMES;
        data.guilds = createInitialGuilds(data.users);
        data.markets.push({ id: 'market-bank', title: 'The Exchange Post', description: 'Exchange your various currencies and experience points.', iconType: 'emoji', icon: '⚖️', status: { type: 'open' } });
        if (setupChoice === 'import' && blueprint) {
            Object.keys(blueprint.assets).forEach(key => {
                if (data[key] && blueprint.assets[key]) {
                    data[key].push(...blueprint.assets[key]);
                }
            });
        }
    }
    data.settings.contentVersion = 2;
    return { status: 201, body: { message: 'First run completed.' } };
}));

router.get('/data', async (req, res) => {
    try {
        const data = await loadData();
        res.json(data);
    } catch (error) {
        console.error("Error in GET /api/data:", error);
        res.status(500).json({ error: 'Failed to load data. ' + error.message });
    }
});

router.post('/data', handleRequest((data, req) => {
    Object.assign(data, req.body);
}));

module.exports = router;
