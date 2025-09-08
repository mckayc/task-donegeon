

const { dataSource } = require('../data-source');
const { MinigameEntity, GameScoreEntity, UserEntity, RewardTypeDefinitionEntity, ChronicleEventEntity } = require('../entities');
const { In } = require("typeorm");
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');

const minigameRepo = dataSource.getRepository(MinigameEntity);
const scoreRepo = dataSource.getRepository(GameScoreEntity);
const userRepo = dataSource.getRepository(UserEntity);
const rewardTypeRepo = dataSource.getRepository(RewardTypeDefinitionEntity);

const getAll = () => minigameRepo.find();
const getAllScores = () => scoreRepo.find();

const update = async (id, data) => {
    const game = await minigameRepo.findOneBy({ id });
    if (!game) return null;
    minigameRepo.merge(game, data);
    const saved = await minigameRepo.save(updateTimestamps(game));
    updateEmitter.emit('update');
    return saved;
};

const play = async (gameId, userId) => {
    return dataSource.transaction(async manager => {
        const user = await manager.findOneBy(UserEntity, { id: userId });
        const game = await manager.findOneBy(MinigameEntity, { id: gameId });
        const gameToken = await manager.findOneBy(RewardTypeDefinitionEntity, { id: 'core-token' });
        
        if (!user || !game || !gameToken) return null;

        const tokenBalance = user.personalPurse[gameToken.id] || 0;

        if (tokenBalance < game.cost) {
            return null; // Not enough tokens
        }

        user.personalPurse[gameToken.id] = tokenBalance - game.cost;
        const updatedUser = await manager.save(UserEntity, updateTimestamps(user));
        
        updateEmitter.emit('update');
        return { updatedUser };
    });
};

const submitScore = async (gameId, userId, score) => {
    return await dataSource.transaction(async manager => {
        const newScoreData = {
            id: `score-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            gameId,
            userId,
            score,
            playedAt: new Date().toISOString(),
        };
        const newScore = scoreRepo.create(newScoreData);
        const savedScore = await scoreRepo.save(updateTimestamps(newScore, true));
        
        const game = await manager.findOneBy(MinigameEntity, { id: gameId });
        if (!game || !game.prizesEnabled || !game.prizeThresholds || game.prizeThresholds.length === 0) {
            updateEmitter.emit('update');
            return savedScore;
        }

        const sortedThresholds = [...game.prizeThresholds].sort((a, b) => b.score - a.score);
        const applicablePrize = sortedThresholds.find(t => score >= t.score);

        if (!applicablePrize || !applicablePrize.rewards || applicablePrize.rewards.length === 0) {
            updateEmitter.emit('update');
            return savedScore;
        }
        
        const user = await manager.findOneBy(UserEntity, { id: userId });
        const rewardTypes = await manager.getRepository(RewardTypeDefinitionEntity).find();
        
        const balances = { purse: user.personalPurse, experience: user.personalExperience };
        
        applicablePrize.rewards.forEach(reward => {
            const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
            if (rewardDef) {
                const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
            }
        });

        user.personalPurse = balances.purse;
        user.personalExperience = balances.experience;
        await manager.save(UserEntity, updateTimestamps(user));

        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
        const rewardsText = applicablePrize.rewards.map(r => `+${r.amount}${getRewardInfo(r.rewardTypeId).icon}`).join(' ');

        const eventData = {
            id: `chron-prize-${savedScore.id}`,
            originalId: savedScore.id,
            date: new Date().toISOString(),
            type: 'PrizeWon',
            title: `Won a prize in ${game.name}!`,
            note: `Scored ${score}, earning the prize for passing ${applicablePrize.score} points.`,
            status: 'Awarded',
            icon: game.icon || '🏆',
            color: '#facc15',
            userId: userId,
            userName: user.gameName,
            actorId: 'system',
            actorName: 'System',
            guildId: undefined,
            rewardsText,
        };
        const newEvent = chronicleRepo.create(eventData);
        await manager.save(ChronicleEventEntity, updateTimestamps(newEvent, true));

        updateEmitter.emit('update');
        return savedScore;
    });
};

const resetAllScores = async (gameId) => {
    await scoreRepo.delete({ gameId });
    updateEmitter.emit('update');
};

const resetScoresForUsers = async (gameId, userIds) => {
    await scoreRepo.delete({ gameId, userId: In(userIds) });
    updateEmitter.emit('update');
};

module.exports = {
    getAll,
    update,
    getAllScores,
    play,
    submitScore,
    resetAllScores,
    resetScoresForUsers,
};