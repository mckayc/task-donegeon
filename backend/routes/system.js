
const express = require('express');
const { dataSource } = require('../data-source');
const { UserEntity, SettingEntity, LoginHistoryEntity, RewardTypeDefinitionEntity, RankEntity, TrophyEntity, ThemeDefinitionEntity, QuestGroupEntity, GuildEntity, MarketEntity, GameAssetEntity, QuestEntity } = require('../entities');
const { 
    INITIAL_SETTINGS, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES, 
    INITIAL_QUEST_GROUPS, INITIAL_GUILDS, INITIAL_MARKETS, INITIAL_GAME_ASSETS, INITIAL_QUESTS 
} = require('../initialData');
const { updateTimestamps } = require('../utils');

module.exports = (updateEmitter) => {
    const router = express.Router();
    
    router.get('/status', async (req, res) => {
        try {
            const userRepo = dataSource.getRepository('User');
            const userCount = await userRepo.count();
            
            res.json({
                isFirstRun: userCount === 0,
                geminiConnected: !!(process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall'),
                database: {
                    connected: dataSource.isInitialized,
                    isCustomPath: !!process.env.DATABASE_PATH,
                },
                jwtSecretSet: !!(process.env.JWT_SECRET && process.env.JWT_SECRET.length > 16),
            });
        } catch (error) {
            // This can happen if the database isn't initialized yet on the very first run
            res.json({
                isFirstRun: true,
                geminiConnected: !!(process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall'),
                database: { connected: false, isCustomPath: !!process.env.DATABASE_PATH },
                jwtSecretSet: !!(process.env.JWT_SECRET && process.env.JWT_SECRET.length > 16),
            });
        }
    });
    
    router.post('/first-run', async (req, res) => {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const { adminUserData } = req.body;
    
            // Save definitional data
            await queryRunner.manager.save(RewardTypeDefinitionEntity, INITIAL_REWARD_TYPES.map(e => updateTimestamps(e, true)));
            await queryRunner.manager.save(RankEntity, INITIAL_RANKS.map(e => updateTimestamps(e, true)));
            await queryRunner.manager.save(TrophyEntity, INITIAL_TROPHIES.map(e => updateTimestamps(e, true)));
            await queryRunner.manager.save(ThemeDefinitionEntity, INITIAL_THEMES.map(e => updateTimestamps(e, true)));
            await queryRunner.manager.save(QuestGroupEntity, INITIAL_QUEST_GROUPS.map(e => updateTimestamps(e, true)));
            
            // Save content data
            await queryRunner.manager.save(MarketEntity, INITIAL_MARKETS.map(e => updateTimestamps(e, true)));
            await queryRunner.manager.save(GameAssetEntity, INITIAL_GAME_ASSETS.map(e => updateTimestamps(e, true)));
    
            // Create the admin user
            const adminId = `user-${Date.now()}`;
            const admin = queryRunner.manager.create(UserEntity, {
                ...adminUserData,
                id: adminId,
                avatar: {}, 
                ownedAssetIds: [], 
                personalPurse: {}, 
                personalExperience: {},
                guildBalances: { 'guild-default': { purse: {}, experience: {} } }, 
                ownedThemes: ['emerald', 'rose', 'sky'], 
                hasBeenOnboarded: true
            });
            const savedAdmin = await queryRunner.manager.save(updateTimestamps(admin, true));
    
            // Create the default guild and assign the admin
            const defaultGuildData = { ...INITIAL_GUILDS[0], memberIds: [savedAdmin.id] };
            await queryRunner.manager.save(GuildEntity, updateTimestamps(defaultGuildData, true));
    
            // Create initial quests and assign them to the admin
            const questsToCreate = INITIAL_QUESTS.map(q => ({
                ...q,
                assignedUserIds: [savedAdmin.id]
            }));
            await queryRunner.manager.save(QuestEntity, questsToCreate.map(e => updateTimestamps(e, true)));
            
            // Save settings & login history
            const settings = queryRunner.manager.create(SettingEntity, { id: 1, settings: INITIAL_SETTINGS });
            await queryRunner.manager.save(updateTimestamps(settings, true));
            
            const loginHistory = queryRunner.manager.create(LoginHistoryEntity, { id: 1, history: [] });
            await queryRunner.manager.save(updateTimestamps(loginHistory, true));
    
            await queryRunner.commitTransaction();
            updateEmitter.emit('update');
            res.status(201).json({ message: 'First run setup complete.' });
    
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error(`First run setup failed:`, error);
            res.status(500).json({ error: `First run setup failed: ${error.message}` });
        } finally {
            await queryRunner.release();
        }
    });

    return router;
};
