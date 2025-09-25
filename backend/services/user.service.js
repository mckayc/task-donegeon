
const userRepository = require('../repositories/user.repository');
const guildRepository = require('../repositories/guild.repository');
const adminAdjustmentRepository = require('../repositories/adminAdjustment.repository');
const trophyRepository = require('../repositories/trophy.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { logGeneralAdminAction, updateTimestamps, checkAndAwardTrophies } = require('../utils/helpers');
const { dataSource } = require('../data-source');
const { QuestCompletionEntity, PurchaseRequestEntity, ChronicleEventEntity, RewardTypeDefinitionEntity, TrophyEntity, UserEntity, UserTrophyEntity } = require('../entities');

/**
 * A centralized function to grant rewards and trophies to a user. This is the single source of truth.
 * This function must be called from within a transaction.
 */
const grantRewards = async (manager, details) => {
    const { 
        userId, rewards = [], setbacks = [], trophyId, actorId,
        chronicleTitle, chronicleNote, chronicleType, chronicleIcon, chronicleColor,
        originalId
    } = details;
    
    const userRepo = manager.getRepository(UserEntity);
    const user = await userRepo.findOneBy({ id: userId });
    if (!user) throw new Error(`User with ID ${userId} not found during reward grant.`);

    // --- Balance Initialization and Update ---
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

    // --- Manual Trophy Award ---
    let manuallyAwardedTrophy = null;
    if (trophyId) {
        const trophy = await manager.getRepository(TrophyEntity).findOneBy({ id: trophyId });
        if (trophy) {
            const userTrophyRepo = manager.getRepository(UserTrophyEntity);
            const newTrophyData = {
                id: `usertrophy-${Date.now()}-${Math.random()}`,
                userId, trophyId, awardedAt: new Date().toISOString(), guildId: undefined // Personal scope
            };
            manuallyAwardedTrophy = await userTrophyRepo.save(updateTimestamps(userTrophyRepo.create(newTrophyData), true));
            rewardsText += ` 🏆 ${trophy.name}`;
        }
    }
    
    const updatedUser = await userRepo.save(updateTimestamps(user));
    
    const actor = await userRepo.findOneBy({ id: actorId });

    // --- Chronicle Entry ---
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
        guildId: undefined, // Personal only
        rewardsText: rewardsText.trim() || undefined,
    };
    await manager.save(chronicleRepo.create(updateTimestamps(eventData, true)));
    
    // --- Automatic Trophy Check ---
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

        if (actorId) {
            await logGeneralAdminAction(manager, { actorId, title: 'Created User', note: `User: ${savedUser.gameName}`, icon: '👤', color: '#84cc16' });
        }
    });

    updateEmitter.emit('update');
    return savedUser;
};

const clone = async (id) => {
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
    
    return create(newUserData, 'system');
};

const update = async (id, userData) => {
    // Add conflict check for username/email
    if (userData.username) {
        const existing = await userRepository.findByUsername(userData.username);
        if (existing && existing.id !== id) {
            console.warn(`[Conflict] Update for user ${id} failed. Username '${userData.username}' is taken.`);
            return null; // Return null on conflict
        }
    }
    if (userData.email) {
        const existing = await userRepository.findByEmail(userData.email);
        if (existing && existing.id !== id) {
            console.warn(`[Conflict] Update for user ${id} failed. Email '${userData.email}' is taken.`);
            return null; // Return null on conflict
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
        await manager.getRepository('User').delete(ids);
        await logGeneralAdminAction(manager, { actorId, actionType: 'delete', assetType: 'User', assetCount: ids.length });
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

module.exports = {
    getAll,
    create,
    clone,
    update,
    deleteMany,
    adjust,
    getPendingItems,
    grantRewards,
};
