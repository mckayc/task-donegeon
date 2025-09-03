
const { dataSource } = require('../data-source');
const { MinigameEntity, GameScoreEntity, UserEntity, RewardTypeDefinitionEntity } = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');

const minigameRepo = dataSource.getRepository(MinigameEntity);
const scoreRepo = dataSource.getRepository(GameScoreEntity);
const userRepo = dataSource.getRepository(UserEntity);
const rewardTypeRepo = dataSource.getRepository(RewardTypeDefinitionEntity);

const getAll = () => minigameRepo.find();
const getAllScores = () => scoreRepo.find();

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
    const newScoreData = {
        id: `score-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        gameId,
        userId,
        score,
        playedAt: new Date().toISOString(),
    };
    const newScore = scoreRepo.create(newScoreData);
    const saved = await scoreRepo.save(updateTimestamps(newScore, true));
    updateEmitter.emit('update');
    return saved;
};

module.exports = {
    getAll,
    getAllScores,
    play,
    submitScore,
};