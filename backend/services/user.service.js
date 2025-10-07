
const userRepository = require('../repositories/user.repository');
const { dataSource } = require('../data-source');
const { UserEntity, QuestCompletionEntity, PurchaseRequestEntity, ChronicleEventEntity, RewardTypeDefinitionEntity, TrophyEntity, UserTrophyEntity, PendingRewardEntity } = require('../entities');
const { In } = require("typeorm");
const { updateEmitter } = require('../utils/updateEmitter');
const { logGeneralAdminAction, logAdminAssetAction, updateTimestamps, checkAndAwardTrophies } = require('../utils/helpers');
const adminAdjustmentRepository = require('../repositories/adminAdjustment.repository');

const grantRewards = async (manager, details) => {
    const { 
        userId, rewards = [], setbacks = [], trophyId, actorId,
        chronicleTitle, chronicleNote, chronicleType, chronicleIcon, chronicleColor,
        originalId
    } = details;
    
    const userRepo = manager.getRepository(UserEntity);
    const user = await userRepo.findOneBy({ id: userId });
    if (!user) throw new Error(`User with ID ${userId} not found during reward grant.`);

    user.personalPurse = user.personalPurse || {};
    user.personalExperience = user.personalExperience || {};
    const balances = { purse: user.personalPurse, experience: user.personalExperience };

    const rewardTypes = await manager.getRepository(RewardTypeDefinitionEntity).find();
    const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
    let rewardsText = '';
    
    const allChanges = [
        ...rewards.map(r => ({ ...r, amount: r.amount })),
        ...setbacks.map(s => ({ ...s, amount: -s.amount }))
    ];

    allChanges.forEach(reward => {
        const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
        if (rewardDef) {
            const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
            const currentAmount = target[reward.rewardTypeId] || 0;
            target[reward.rewardTypeId] = Math.max(0, currentAmount + reward.amount);
            
            if (reward.amount > 0) rewardsText += `+${reward.amount}${getRewardInfo(reward.rewardTypeId).icon} `;
            else if (reward.amount < 0) rewardsText += `${reward.amount}${getRewardInfo(reward.rewardTypeId).icon} `;
        }
    });

    let manuallyAwardedTrophy = null;
    if (trophyId) {
        const trophy = await manager.getRepository(TrophyEntity).findOneBy({ id: trophyId });
        if (trophy) {
            const userTrophyRepo = manager.getRepository(UserTrophyEntity);
            const newTrophyData = {
                id: `usertrophy-${Date.now()}-${Math.random()}`,
                userId, trophyId, awardedAt: new Date().toISOString(), guildId: undefined
            };
            manuallyAwardedTrophy = await userTrophyRepo.save(updateTimestamps(userTrophyRepo.create(newTrophyData), true));
            rewardsText += ` 🏆 ${trophy.name}`;
        }
    }
    
    const updatedUser = await userRepo.save(updateTimestamps(user));
    
    const actor = await userRepo.findOneBy({ id: actorId });

    const chronicleRepo = manager.getRepository(ChronicleEventEntity);
    const eventData = {
        id: `chron-${chronicleType.toLowerCase()}-${userId}-${Date.now()}`,
        originalId: originalId || `reward-grant-${Date.now()}`,
        date: new Date().toISOString(),
        type: chronicleType,
        title: chronicleTitle,
        note: chronicleNote,
        status: 'Awarded',
        icon: chronicleIcon,
        color: chronicleColor,
        userId,
        userName: user.gameName,
        actorId,
        actorName: actor?.gameName || 'System',
        guildId: undefined, // Personal only for now
        rewardsText: rewardsText.trim() || undefined,
    };
    await manager.save(chronicleRepo.create(updateTimestamps(eventData, true)));
    
    const { newUserTrophies, newNotifications } = await checkAndAwardTrophies(manager, userId, undefined);
    if (manuallyAwardedTrophy) newUserTrophies.push(manuallyAwardedTrophy);

    return { updatedUser, newUserTrophies, newNotifications };
};

const getAll = (options) => userRepository.findAll(options);

const create = async (userData, actorId) => {
    const conflict = await userRepository.findByUsernameOrEmail(userData.username, userData.email);
    if (conflict) return null;

    let savedUser;

    await dataSource.transaction(async manager => {
        const userRepo = manager.getRepository('User');
        const newUser = userRepo.create({
            ...userData,
            id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            profilePictureUrl: null, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
            guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false,
        });
        savedUser = await userRepo.save(updateTimestamps(newUser, true));
        
        const defaultGuild = await manager.getRepository('Guild').findOne({ where: { isDefault: true }, relations: ['members'] });
        if (defaultGuild) {
            defaultGuild.members.push(savedUser);
            await manager.save(updateTimestamps(defaultGuild));
        }

        if (actorId && actorId !== 'system') {
            await logGeneralAdminAction(manager, { actorId, title: 'Created User', note: `User: ${savedUser.gameName}`, icon: '👤', color: '#84cc16' });
        } else if (actorId === 'system') {
             await logGeneralAdminAction(manager, { actorId, title: 'Cloned User', note: `New user: ${savedUser.gameName}`, icon: '👤', color: '#84cc16' });
        }
    });

    updateEmitter.emit('update');
    return savedUser;
};

const clone = async (id, actorId) => {
    const userToClone = await userRepository.findById(id);
    if (!userToClone) return null;
    const { id: oldId, username, email, gameName, profilePictureUrl, ...restOfUser } = userToClone;
    const timestamp = Date.now().toString().slice(-5);
    const newUsername = `${username}_clone_${timestamp}`;
    const newEmail = `clone_${timestamp}_${email}`;
    const newGameName = `${gameName} (Clone)`;
    const newUserData = {
        ...restOfUser,
        username: newUsername,
        email: newEmail,
        gameName: newGameName,
        personalPurse: {},
        personalExperience: {},
        guildBalances: {},
        ownedAssetIds: [],
        ownedThemes: ['emerald', 'rose', 'sky'],
        hasBeenOnboarded: false,
    };
    return create(newUserData, actorId);
};

const update = async (id, userData) => {
    if (userData.username) {
        const existing = await userRepository.findByUsername(userData.username);
        if (existing && existing.id !== id) {
            return null;
        }
    }
    if (userData.email) {
        const existing = await userRepository.findByEmail(userData.email);
        if (existing && existing.id !== id) {
            return null;
        }
    }
    const result = await userRepository.update(id, userData);
    if (result) {
        updateEmitter.emit('update');
    }
    return result;
};

const deleteMany = async (ids, actorId) => {
    await dataSource.transaction(async manager => {
        const userRepo = manager.getRepository(UserEntity);
        const usersToRemove = await userRepo.findBy({ id: In(ids) });
        
        if (usersToRemove.length > 0) {
            await userRepo.remove(usersToRemove);
            await logAdminAssetAction(manager, { actorId, actionType: 'delete', assetType: 'User', assetCount: ids.length });
        }
    });
    updateEmitter.emit('update');
};

const adjust = async (adjustmentData) => {
    return await dataSource.transaction(async manager => {
        const { userId, adjusterId, reason, rewards, setbacks, trophyId } = adjustmentData;
        const isPrize = reason?.startsWith('Reward from');
        const grantDetails = {
            userId,
            rewards,
            setbacks,
            trophyId,
            actorId: adjusterId,
            chronicleTitle: isPrize ? 'Prize Won' : 'Manual Adjustment',
            chronicleNote: reason,
            chronicleType: isPrize ? 'PrizeWon' : 'AdminAdjustment',
            chronicleIcon: isPrize ? '🏆' : '⚖️',
            chronicleColor: isPrize ? '#facc15' : '#a855f7'
        };
        const { updatedUser, newUserTrophies, newNotifications } = await grantRewards(manager, grantDetails);
        const newAdjustment = await adminAdjustmentRepository.create({ ...adjustmentData, adjustedAt: new Date().toISOString() });
        updateEmitter.emit('update');
        return { updatedUser, newAdjustment, newUserTrophies, newNotifications };
    });
};

const getPendingItems = async (userId) => {
    const questCompletions = await dataSource.getRepository(QuestCompletionEntity).find({
        where: { user: { id: userId }, status: 'Pending' },
        relations: ['quest'],
        order: { completedAt: 'DESC' }
    });
    
    const purchaseRequests = await dataSource.getRepository(PurchaseRequestEntity).find({
        where: { userId, status: 'Pending' },
        order: { requestedAt: 'DESC' }
    });

    return {
        quests: questCompletions.map(c => ({ id: c.id, title: c.quest.title, submittedAt: c.completedAt, questId: c.quest.id })),
        purchases: purchaseRequests.map(p => ({ id: p.id, title: p.assetDetails.name, submittedAt: p.requestedAt })),
    };
};

const generateRewardToken = async (details) => {
    const { userId, rewards, source } = details;
    return await dataSource.transaction(async manager => {
        const user = await manager.findOneBy(UserEntity, { id: userId });
        if (!user) throw new Error('User not found.');
        const token = `rew_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const pendingRewardRepo = manager.getRepository(PendingRewardEntity);
        const newPendingReward = pendingRewardRepo.create({
            id: token,
            userId,
            rewards,
            source,
            status: 'pending'
        });
        await pendingRewardRepo.save(updateTimestamps(newPendingReward, true));
        return token;
    });
};

const claimRewardToken = async (token) => {
    return await dataSource.transaction(async manager => {
        const pendingRewardRepo = manager.getRepository(PendingRewardEntity);
        const pendingReward = await pendingRewardRepo.findOneBy({ id: token });

        if (!pendingReward) throw new Error('Reward token not found.');
        if (pendingReward.status !== 'pending') throw new Error('Reward token has already been claimed.');
        
        const grantDetails = {
            userId: pendingReward.userId,
            rewards: pendingReward.rewards,
            actorId: 'system',
            chronicleTitle: 'Prize Won',
            chronicleNote: pendingReward.source,
            chronicleType: 'PrizeWon',
            chronicleIcon: '🏆',
            chronicleColor: '#facc15',
            originalId: pendingReward.id,
        };

        const grantResult = await grantRewards(manager, grantDetails);
        
        pendingReward.status = 'claimed';
        await pendingRewardRepo.save(updateTimestamps(pendingReward));
        updateEmitter.emit('update');
        return grantResult;
    });
};


module.exports = {
    getAll,
    create,
    clone,
    update,
    deleteMany,
    adjust,
    getPendingItems,
    grantRewards,
    generateRewardToken,
    claimRewardToken,
};
