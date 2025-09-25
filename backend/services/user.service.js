

const userRepository = require('../repositories/user.repository');
const guildRepository = require('../repositories/guild.repository');
const adminAdjustmentRepository = require('../repositories/adminAdjustment.repository');
const trophyRepository = require('../repositories/trophy.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { logGeneralAdminAction, updateTimestamps, checkAndAwardTrophies } = require('../utils/helpers');
const { dataSource } = require('../data-source');
const { QuestCompletionEntity, PurchaseRequestEntity, ChronicleEventEntity, RewardTypeDefinitionEntity, TrophyEntity, UserEntity } = require('../entities');

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
        const userRepo = manager.getRepository(UserEntity);
        const trophyRepo = manager.getRepository(TrophyEntity);
        const rewardTypeRepo = manager.getRepository(RewardTypeDefinitionEntity);
        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const userTrophyRepo = manager.getRepository(UserTrophyEntity);

        const user = await userRepo.findOneBy({ id: adjustmentData.userId });
        if (!user) return null;

        const isGuildScope = !!adjustmentData.guildId;
        
        // Robustly get balances, initializing if necessary
        const balances = (() => {
            if (isGuildScope) {
                if (!user.guildBalances) user.guildBalances = {};
                if (!user.guildBalances[adjustmentData.guildId]) user.guildBalances[adjustmentData.guildId] = { purse: {}, experience: {} };
                user.guildBalances[adjustmentData.guildId].purse = user.guildBalances[adjustmentData.guildId].purse || {};
                user.guildBalances[adjustmentData.guildId].experience = user.guildBalances[adjustmentData.guildId].experience || {};
                return user.guildBalances[adjustmentData.guildId];
            }
            user.personalPurse = user.personalPurse || {};
            user.personalExperience = user.personalExperience || {};
            return { purse: user.personalPurse, experience: user.personalExperience };
        })();
        
        const rewardTypes = await rewardTypeRepo.find();
        
        adjustmentData.rewards?.forEach(reward => {
            const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
            if(rewardDef) {
                const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
            }
        });
        
        adjustmentData.setbacks?.forEach(setback => {
            const rewardDef = rewardTypes.find(rt => rt.id === setback.rewardTypeId);
             if(rewardDef) {
                const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                target[reward.rewardTypeId] = Math.max(0, (target[reward.rewardTypeId] || 0) - setback.amount);
            }
        });

        let newUserTrophy = null;
        if (adjustmentData.trophyId) {
            const trophy = await trophyRepo.findOneBy({ id: adjustmentData.trophyId });
            if (trophy) {
                const newTrophyData = {
                    id: `usertrophy-${Date.now()}-${Math.random()}`,
                    userId: user.id,
                    trophyId: trophy.id,
                    awardedAt: new Date().toISOString(),
                    guildId: adjustmentData.guildId || undefined
                };
                newUserTrophy = await userTrophyRepo.save(updateTimestamps(userTrophyRepo.create(newTrophyData), true));
            }
        }

        const updatedUser = await userRepo.save(updateTimestamps(user));
        const newAdjustment = await adminAdjustmentRepository.create({ ...adjustmentData, adjustedAt: new Date().toISOString() });
        
        // --- Chronicle Logging ---
        const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
        const rewardsText = (adjustmentData.rewards || []).map(r => `+${r.amount}${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
        const setbacksText = (adjustmentData.setbacks || []).map(s => `-${s.amount}${getRewardInfo(s.rewardTypeId).icon}`).join(' ');
        const trophy = adjustmentData.trophyId ? await trophyRepo.findOneBy({ id: adjustmentData.trophyId }) : null;
        const trophyText = trophy ? ` 🏆 ${trophy.name}` : '';

        const actor = await manager.findOneBy(UserEntity, { id: adjustmentData.adjusterId });

        const isPrize = adjustmentData.reason?.startsWith('Reward from');

        const eventData = {
            id: `chron-adj-${newAdjustment.id}`,
            originalId: newAdjustment.id,
            date: newAdjustment.adjustedAt,
            type: isPrize ? 'PrizeWon' : 'AdminAdjustment',
            title: isPrize ? 'Prize Won!' : 'Manual Adjustment',
            note: adjustmentData.reason,
            status: 'Awarded',
            icon: isPrize ? '🏆' : '⚖️',
            color: isPrize ? '#facc15' : '#a855f7',
            userId: user.id,
            userName: user.gameName,
            actorId: adjustmentData.adjusterId,
            actorName: actor?.gameName || 'System',
            guildId: adjustmentData.guildId || undefined,
            rewardsText: `${rewardsText} ${setbacksText}${trophyText}`.trim() || undefined,
        };

        const newEvent = chronicleRepo.create(eventData);
        await manager.save(updateTimestamps(newEvent, true));
        
        // Check for auto-awarded trophies
        const { newUserTrophies, newNotifications } = await checkAndAwardTrophies(manager, user.id, adjustmentData.guildId);
        if (newUserTrophy) newUserTrophies.push(newUserTrophy);

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
};