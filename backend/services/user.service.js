
const userRepository = require('../repositories/user.repository');
const guildRepository = require('../repositories/guild.repository');
const adminAdjustmentRepository = require('../repositories/adminAdjustment.repository');
const trophyRepository = require('../repositories/trophy.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { logGeneralAdminAction, updateTimestamps } = require('../utils/helpers');
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
            avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
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

    const suffix = Date.now().toString().slice(-5);
    const newUserData = {
        ...userToClone,
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        username: `${userToClone.username}${suffix}`,
        email: `clone_${suffix}_${userToClone.email}`,
        gameName: `${userToClone.gameName} (Copy)`,
        personalPurse: {},
        personalExperience: {},
        guildBalances: {},
        ownedAssetIds: [],
        ownedThemes: ['emerald', 'rose', 'sky'],
        hasBeenOnboarded: false,
    };
    
    const savedUser = await userRepository.create(newUserData);
    
    const defaultGuild = await guildRepository.findDefault();
    if (defaultGuild) {
        await guildRepository.addMember(defaultGuild.id, savedUser.id);
    }

    updateEmitter.emit('update');
    return savedUser;
};

const update = async (id, userData) => {
    const user = await userRepository.findById(id);
    if (!user) return { success: false, status: 404, message: 'User not found' };

    if (userData.username && userData.username !== user.username) {
        const conflict = await userRepository.findByUsername(userData.username);
        if (conflict) return { success: false, status: 409, message: 'Username already in use.' };
    }
    if (userData.email && userData.email !== user.email) {
        const conflict = await userRepository.findByEmail(userData.email);
        if (conflict) return { success: false, status: 409, message: 'Email already in use.' };
    }

    const saved = await userRepository.update(id, userData);
    updateEmitter.emit('update');
    return { success: true, user: saved };
};

const deleteMany = async (ids, actorId) => {
    if (ids.length > 0) {
        await dataSource.transaction(async manager => {
            await manager.getRepository('User').delete(ids);
            await logGeneralAdminAction(manager, { actorId, title: `Deleted ${ids.length} User(s)`, note: `IDs: ${ids.join(', ')}`, icon: '🗑️', color: '#ef4444' });
        });
        updateEmitter.emit('update');
    }
};

const adjust = async (adjustmentData) => {
    return await dataSource.transaction(async manager => {
        const user = await manager.getRepository(UserEntity).findOneBy({ id: adjustmentData.userId });
        if (!user) return null;

        const newAdjustment = {
            ...adjustmentData,
            adjustedAt: new Date().toISOString()
        };
        const savedAdjustment = await manager.getRepository('AdminAdjustment').save(updateTimestamps(newAdjustment, true));

        let newUserTrophy = null;
        if (adjustmentData.trophyId) {
            const newTrophyData = {
                userId: user.id,
                trophyId: adjustmentData.trophyId,
                awardedAt: new Date().toISOString(),
                guildId: adjustmentData.guildId || undefined,
            };
            const newUserTrophyEntity = await manager.getRepository('UserTrophy').create(newTrophyData);
            newUserTrophy = await manager.getRepository('UserTrophy').save(updateTimestamps(newUserTrophyEntity, true));
        }
        
        const rewardTypes = await manager.getRepository(RewardTypeDefinitionEntity).find();
        const isGuildScope = !!adjustmentData.guildId;
        
        // Initialize balances if they don't exist
        if (isGuildScope && !user.guildBalances[adjustmentData.guildId]) {
            user.guildBalances[adjustmentData.guildId] = { purse: {}, experience: {} };
        }
        const balances = isGuildScope 
            ? user.guildBalances[adjustmentData.guildId]
            : { purse: user.personalPurse, experience: user.personalExperience };
        
        const processItems = (items, isSetback) => {
            if (!items) return;
            items.forEach(item => {
                const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
                if (rewardDef) {
                    const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                    const change = isSetback ? -item.amount : item.amount;
                    target[item.rewardTypeId] = (target[item.rewardTypeId] || 0) + change;
                }
            });
        };

        processItems(adjustmentData.rewards, false);
        processItems(adjustmentData.setbacks, true);

        if(isGuildScope) {
            user.guildBalances[adjustmentData.guildId] = balances;
        } else {
            user.personalPurse = balances.purse;
            user.personalExperience = balances.experience;
        }

        const updatedUser = await manager.getRepository(UserEntity).save(updateTimestamps(user));
        
        // --- Chronicle Logging ---
        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const adjuster = await manager.getRepository(UserEntity).findOneBy({ id: adjustmentData.adjusterId });
        const trophy = adjustmentData.trophyId ? await manager.getRepository(TrophyEntity).findOneBy({ id: adjustmentData.trophyId }) : null;
        
        const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };

        const rewardsText = (adjustmentData.rewards || []).map(r => `+${r.amount}${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
        const setbacksText = (adjustmentData.setbacks || []).map(s => `-${s.amount}${getRewardInfo(s.rewardTypeId).icon}`).join(' ');
        const trophyText = trophy ? `🏆${trophy.icon}` : '';
        const combinedRewardsText = [rewardsText, setbacksText, trophyText].filter(Boolean).join(' ');

        const eventData = {
            id: `chron-adj-${savedAdjustment.id}`,
            originalId: savedAdjustment.id,
            date: savedAdjustment.adjustedAt,
            type: 'AdminAdjustment',
            title: `Manual Adjustment`,
            note: savedAdjustment.reason,
            status: 'Awarded',
            icon: '🔧',
            color: '#a855f7',
            userId: user.id,
            userName: user.gameName,
            actorId: adjuster.id,
            actorName: adjuster.gameName,
            guildId: adjustmentData.guildId || undefined,
            rewardsText: combinedRewardsText,
        };
        const newEvent = chronicleRepo.create(eventData);
        await manager.save(updateTimestamps(newEvent, true));

        updateEmitter.emit('update');
        return { updatedUser, newAdjustment: savedAdjustment, newUserTrophy };
    });
};

const getPendingItems = async (userId) => {
    const questCompletions = await dataSource.getRepository(QuestCompletionEntity).find({
        where: { userId, status: 'Pending' },
        relations: ['quest'],
        order: { completedAt: 'DESC' }
    });

    const purchaseRequests = await dataSource.getRepository(PurchaseRequestEntity).find({
        where: { userId, status: 'Pending' },
        order: { requestedAt: 'DESC' }
    });

    return {
        quests: questCompletions.map(c => ({
            id: c.id,
            title: c.quest.title,
            submittedAt: c.completedAt,
            questId: c.quest.id,
        })),
        purchases: purchaseRequests.map(p => ({
            id: p.id,
            title: p.assetDetails.name,
            submittedAt: p.requestedAt,
        })),
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
