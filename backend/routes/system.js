
const express = require('express');
const { dataSource } = require('../data-source');
const { allEntities, SettingEntity, LoginHistoryEntity } = require('../entities');
const { INITIAL_SETTINGS, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES, INITIAL_QUEST_GROUPS } = require('../initialData');

const router = express.Router();

router.get('/status', async (req, res) => {
    try {
        const userRepo = dataSource.getRepository('User');
        const userCount = await userRepo.count();
        
        const status = {
            isFirstRun: userCount === 0,
            geminiConnected: !!(process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall'),
            database: {
                connected: dataSource.isInitialized,
                isCustomPath: process.env.DATABASE_PATH !== undefined,
            },
            jwtSecretSet: !!(process.env.JWT_SECRET && process.env.JWT_SECRET.length > 16),
        };
        res.json(status);
    } catch (error) {
        // If it fails, it might be before the first run, so return a default "first run" state
        res.json({
            isFirstRun: true,
            geminiConnected: false,
            database: { connected: false, isCustomPath: false },
            jwtSecretSet: false,
        });
    }
});

router.post('/first-run', async (req, res) => {
    // This is a simplified first-run setup. A real one would be more transactional.
    try {
        const { adminUserData } = req.body;
        
        // Save initial data
        await dataSource.getRepository('RewardTypeDefinition').save(INITIAL_REWARD_TYPES);
        await dataSource.getRepository('Rank').save(INITIAL_RANKS);
        await dataSource.getRepository('Trophy').save(INITIAL_TROPHIES);
        await dataSource.getRepository('ThemeDefinition').save(INITIAL_THEMES);
        await dataSource.getRepository('QuestGroup').save(INITIAL_QUEST_GROUPS);
        
        // Save settings and login history
        await dataSource.getRepository(SettingEntity).save({ id: 1, settings: INITIAL_SETTINGS });
        await dataSource.getRepository(LoginHistoryEntity).save({ id: 1, history: [] });

        // Create admin user
        const userRepo = dataSource.getRepository('User');
        const adminId = `user-${Date.now()}`;
        const admin = userRepo.create({
            ...adminUserData,
            id: adminId,
            avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
            guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: true
        });
        await userRepo.save(admin);
        
        res.status(201).json({ message: 'First run setup complete.' });
    } catch (error) {
        res.status(500).json({ error: `First run setup failed: ${error.message}` });
    }
});

module.exports = router;
