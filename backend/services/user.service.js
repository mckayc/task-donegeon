
const { dataSource } = require('../data-source');
const { UserEntity, QuestCompletionEntity, PurchaseRequestEntity, ChronicleEventEntity, RewardTypeDefinitionEntity, TrophyEntity, UserTrophyEntity, PendingRewardEntity, SettingEntity, GuildEntity } = require('../entities');
const { In } = require("typeorm");
const { updateEmitter } = require('../utils/updateEmitter');
const { logGeneralAdminAction, logAdminAssetAction, updateTimestamps, checkAndAwardTrophies } = require('../utils/helpers');
const adminAdjustmentRepository = require('../repositories/adminAdjustment.repository');
const { INITIAL_SETTINGS } = require('../initialData');

const grantRewards = async (manager, details) => {
    const { 
        userId, rewards = [], setbacks = [], trophyId, actorId,
        chronicleTitle, chronicleNote, chronicleType, chronicleIcon, chronicleColor,
        originalId, guildId, allowSetbackSubstitution
    } = details;
    
    const userRepo = manager.getRepository(UserEntity);
    const user = await userRepo.findOneBy({ id: userId });
    if (!user) throw new Error(`User with ID ${userId} not found during reward grant.`);

    user.personalPurse = user.personalPurse || {};
    user.personalExperience = user.personalExperience || {};
    if (guildId) {
        user.guildBalances = user.guildBalances || {};
        user.guildBalances[guildId] = user.guildBalances[guildId] || { purse: {}, experience: {} };
    }
    
    const isGuildScope = !!guildId;
    const balances = isGuildScope ? user.guildBalances[guildId] : { purse: user.personalPurse, experience: user.personalExperience };

    const rewardTypes = await manager.getRepository(RewardTypeDefinitionEntity).find();
    const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
    
    const actualChanges = [];

    // 1. Process positive rewards (additions)
    rewards.forEach(reward => {
        const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
        if (rewardDef) {
            const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
            target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
            actualChanges.push({ rewardTypeId: reward.rewardTypeId, amount: reward.amount });
        }
    });

    // 2. Process setbacks with potential substitution
    for (const setback of setbacks) {
        const rewardDef = rewardTypes.find(rt => rt.id === setback.rewardTypeId);
        if (!rewardDef) continue;
        
        const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
        const currentBalance = target[setback.rewardTypeId] || 0;
        const amountToDeduct = Math.min(currentBalance, setback.amount);
        
        if (amountToDeduct > 0) {
            target[setback.rewardTypeId] -= amountToDeduct;
            actualChanges.push({ rewardTypeId: setback.rewardTypeId, amount: -amountToDeduct });
        }
        
        const deficit = setback.amount - amountToDeduct;
        if (deficit > 0 && allowSetbackSubstitution) {
            let valueToCover = deficit * (rewardDef.baseValue || 0);
            if (valueToCover > 0) {
                const substitutableRewards = rewardTypes
                    .filter(rt => rt.baseValue > 0 && rt.id !== setback.rewardTypeId && rt.isExchangeable !== false)
                    .sort((a, b) => b.baseValue - a.baseValue); // From most valuable to least valuable

                for (const subReward of substitutableRewards) {
                    if (valueToCover <= 0) break;
                    
                    const subTarget = subReward.category === 'Currency' ? balances.purse : balances.experience;
                    const subBalance = subTarget[subReward.id] || 0;
                    
                    if (subBalance > 0) {
                        const amountOfSubToDeductInValue = Math.min(subBalance * subReward.baseValue, valueToCover);
                        const amountOfSubToDeductInUnits = Math.ceil(amountOfSubToDeductInValue / subReward.baseValue);
                        const actualAmountToDeduct = Math.min(subBalance, amountOfSubToDeductInUnits);
                        
                        if (actualAmountToDeduct > 0) {
                            subTarget[subReward.id] -= actualAmountToDeduct;
                            actualChanges.push({ rewardTypeId: subReward.id, amount: -actualAmountToDeduct });
                            valueToCover -= actualAmountToDeduct * subReward.baseValue;
                        }
                    }
                }
            }
        }
    }

    let manuallyAwardedTrophy = null;
    let awardedTrophyName = '';
    if (trophyId) {
        const trophy = await manager.getRepository(TrophyEntity).findOneBy({ id: trophyId });
        if (trophy) {
            const userTrophyRepo = manager.getRepository(UserTrophyEntity);
            const newTrophyData = {
                id: `usertrophy-${Date.now()}-${Math.random()}`,
                userId, trophyId, awardedAt: new Date().toISOString(),
                guildId: guildId || undefined,
            };
            manuallyAwardedTrophy = await userTrophyRepo.save(updateTimestamps(userTrophyRepo.create(newTrophyData), true));
            awardedTrophyName = trophy.name;
        }
    }
    
    if (isGuildScope) {
        user.guildBalances[guildId] = balances;
    }
    const userUpdatePayload = isGuildScope ? { guildBalances: user.guildBalances } : { personalPurse: balances.purse, personalExperience: balances.experience };
    const updatedUser = await userRepo.save(updateTimestamps({ ...user, ...userUpdatePayload }));
    
    const actor = await userRepo.findOneBy({ id: actorId });

    const chronicleRepo = manager.getRepository(ChronicleEventEntity);
    let rewardsText = actualChanges.map(change => 
        `${change.amount > 0 ? '+' : ''}${change.amount}${getRewardInfo(change.rewardTypeId).icon}`
    ).join(' ');

    if (manuallyAwardedTrophy) {
        rewardsText += ` 🏆 ${awardedTrophyName}`;
    }

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
        guildId: guildId || undefined,
        rewardsText: rewardsText.trim() || undefined,
    };
    await manager.save(chronicleRepo.create(updateTimestamps(eventData, true)));
    
    const { newUserTrophies, newNotifications } = await checkAndAwardTrophies(manager, userId, guildId);
    if (manuallyAwardedTrophy) newUserTrophies.push(manuallyAwardedTrophy);

    return { updatedUser, newUserTrophies, newNotifications };
};

const getAll = (options) => dataSource.getRepository(UserEntity).find(options);

const create = async (userData, actorId) => {
    const userRepo = dataSource.getRepository(UserEntity);
    const conflict = await userRepo.findOne({ where: [{ username: userData.username }, { email: userData.email }]});
    if (conflict) return null;

    let savedUser;

    await dataSource.transaction(async manager => {
        const newUser = manager.create(UserEntity, {
            ...userData,
            id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            profilePictureUrl: null, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
            guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false,
        });
        savedUser = await manager.save(updateTimestamps(newUser, true));
        
        const defaultGuild = await manager.findOne(GuildEntity, { where: { isDefault: true }, relations: ['members'] });
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
    const userRepo = dataSource.getRepository(UserEntity);
    const userToClone = await userRepo.findOneBy({ id });
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
        personalPurse: {}, personalExperience: {}, guildBalances: {},
        ownedAssetIds: [], ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false,
    };
    return create(newUserData, actorId);
};

const update = async (id, userData) => {
    const userRepo = dataSource.getRepository(UserEntity);
    const user = await userRepo.findOneBy({ id });
    if (!user) return null;
    userRepo.merge(user, userData);
    const result = await userRepo.save(updateTimestamps(user));
    if (result) updateEmitter.emit('update');
    return result;
};

const deleteMany = async (ids, actorId) => {
    await dataSource.transaction(async manager => {
        await manager.getRepository(UserEntity).delete(ids);
        await logAdminAssetAction(manager, { actorId, actionType: 'delete', assetType: 'User', assetCount: ids.length });
    });
    updateEmitter.emit('update');
};

const adjust = async (adjustmentData) => {
    return await dataSource.transaction(async manager => {
        const { userId, adjusterId, reason, rewards, setbacks, trophyId, guildId } = adjustmentData;
        const isPrize = reason?.startsWith('Reward from');
        const grantDetails = {
            userId, rewards, setbacks, trophyId, actorId: adjusterId,
            chronicleTitle: isPrize ? 'Prize Won' : 'Manual Adjustment',
            chronicleNote: reason, chronicleType: isPrize ? 'PrizeWon' : 'AdminAdjustment',
            chronicleIcon: isPrize ? '🏆' : '⚖️', chronicleColor: isPrize ? '#facc15' : '#a855f7',
            guildId
        };
        const { updatedUser, newUserTrophies, newNotifications } = await grantRewards(manager, grantDetails);
        const newAdjustment = await adminAdjustmentRepository.create({ ...adjustmentData, adjustedAt: new Date().toISOString() });
        updateEmitter.emit('update');
        return { updatedUser, newAdjustment, newUserTrophies, newNotifications };
    });
};

const getPendingItems = async (userId) => {
    const questCompletions = await dataSource.getRepository(QuestCompletionEntity).find({ where: { user: { id: userId }, status: 'Pending' }, relations: ['quest'], order: { completedAt: 'DESC' } });
    const purchaseRequests = await dataSource.getRepository(PurchaseRequestEntity).find({ where: { userId, status: 'Pending' }, order: { requestedAt: 'DESC' } });
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
        const newPendingReward = pendingRewardRepo.create({ id: token, userId, rewards, source, status: 'pending' });
        await pendingRewardRepo.save(updateTimestamps(newPendingReward, true));
        return token;
    });
};

const claimRewardToken = async (token) => {
    return await dataSource.transaction(async manager => {
        const pendingReward = await manager.findOneBy(PendingRewardEntity, { id: token });
        if (!pendingReward || pendingReward.status !== 'pending') throw new Error('Reward token not found or already claimed.');
        
        const grantDetails = {
            userId: pendingReward.userId, rewards: pendingReward.rewards, actorId: 'system',
            chronicleTitle: 'Prize Won', chronicleNote: pendingReward.source, chronicleType: 'PrizeWon',
            chronicleIcon: '🏆', chronicleColor: '#facc15', originalId: pendingReward.id,
        };
        const grantResult = await grantRewards(manager, grantDetails);
        
        pendingReward.status = 'claimed';
        await manager.save(updateTimestamps(pendingReward));
        updateEmitter.emit('update');
        return grantResult;
    });
};

const depositToVault = async (userId, amounts) => {
    return await dataSource.transaction(async manager => {
        const user = await manager.findOneBy(UserEntity, { id: userId });
        if (!user) throw new Error('User not found.');

        user.vault = user.vault || { purse: {}, experience: {} };
        user.vault.purse = user.vault.purse || {};
        user.vault.experience = user.vault.experience || {};
        
        const allRewardsToDeposit = [];

        for (const [rewardTypeId, amount] of Object.entries(amounts.purse || {})) {
            if (amount <= 0) continue;
            if ((user.personalPurse[rewardTypeId] || 0) < amount) throw new Error('Insufficient funds in wallet.');
            user.personalPurse[rewardTypeId] -= amount;
            user.vault.purse[rewardTypeId] = (user.vault.purse[rewardTypeId] || 0) + amount;
            allRewardsToDeposit.push({ rewardTypeId, amount });
        }
        for (const [rewardTypeId, amount] of Object.entries(amounts.experience || {})) {
            if (amount <= 0) continue;
            if ((user.personalExperience[rewardTypeId] || 0) < amount) throw new Error('Insufficient experience in wallet.');
            user.personalExperience[rewardTypeId] -= amount;
            user.vault.experience[rewardTypeId] = (user.vault.experience[rewardTypeId] || 0) + amount;
            allRewardsToDeposit.push({ rewardTypeId, amount });
        }
        
        const updatedUser = await manager.save(updateTimestamps(user));

        const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
        const rewardsText = allRewardsToDeposit.map(r => `+${r.amount}${(rewardTypes.find(rt => rt.id === r.rewardTypeId)?.icon || '')}`).join(' ');

        await manager.save(ChronicleEventEntity, updateTimestamps(manager.create(ChronicleEventEntity, {
            id: `chron-vdeposit-${Date.now()}`, originalId: `vdeposit-${Date.now()}`, date: new Date().toISOString(), type: 'VaultDeposit',
            title: `Deposited into Vault`, status: 'Deposited', icon: '📥', color: '#22c55e', userId, userName: user.gameName,
            actorId: userId, actorName: user.gameName, rewardsText
        }), true));

        updateEmitter.emit('update');
        return { updatedUser };
    });
};

const withdrawFromVault = async (userId, amounts) => {
    return await dataSource.transaction(async manager => {
        const user = await manager.findOneBy(UserEntity, { id: userId });
        if (!user || !user.vault) throw new Error('User or vault not found.');
        
        const allRewardsToWithdraw = [];

        for (const [rewardTypeId, amount] of Object.entries(amounts.purse || {})) {
            if (amount <= 0) continue;
            if ((user.vault.purse?.[rewardTypeId] || 0) < amount) throw new Error('Insufficient funds in vault.');
            user.vault.purse[rewardTypeId] -= amount;
            user.personalPurse[rewardTypeId] = (user.personalPurse[rewardTypeId] || 0) + amount;
            allRewardsToWithdraw.push({ rewardTypeId, amount });
        }
        for (const [rewardTypeId, amount] of Object.entries(amounts.experience || {})) {
             if (amount <= 0) continue;
            if ((user.vault.experience?.[rewardTypeId] || 0) < amount) throw new Error('Insufficient experience in vault.');
            user.vault.experience[rewardTypeId] -= amount;
            user.personalExperience[rewardTypeId] = (user.personalExperience[rewardTypeId] || 0) + amount;
            allRewardsToWithdraw.push({ rewardTypeId, amount });
        }
        
        const updatedUser = await manager.save(updateTimestamps(user));
        
        const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
        const rewardsText = allRewardsToWithdraw.map(r => `-${r.amount}${(rewardTypes.find(rt => rt.id === r.rewardTypeId)?.icon || '')}`).join(' ');

        await manager.save(ChronicleEventEntity, updateTimestamps(manager.create(ChronicleEventEntity, {
            id: `chron-vwithdraw-${Date.now()}`, originalId: `vwithdraw-${Date.now()}`, date: new Date().toISOString(), type: 'VaultWithdrawal',
            title: `Withdrew from Vault`, status: 'Withdrawn', icon: '📤', color: '#3b82f6', userId, userName: user.gameName,
            actorId: userId, actorName: user.gameName, rewardsText
        }), true));
        
        updateEmitter.emit('update');
        return { updatedUser };
    });
};

const accrueInterestForUser = async (userId) => {
     return await dataSource.transaction(async manager => {
        const user = await manager.findOneBy(UserEntity, { id: userId });
        const settings = (await manager.findOneBy(SettingEntity, { id: 1 }))?.settings || INITIAL_SETTINGS;

        if (!user || !user.vault || !settings.enchantedVault.enabled) {
            return { updatedUser: user, interestApplied: 0 };
        }

        const today = new Date().toISOString().split('T')[0];
        if (user.lastVaultInterestAccrued === today) {
            return { updatedUser: user, interestApplied: 0 };
        }

        let totalInterestApplied = 0;
        const interestRewards = [];
        const tiers = settings.enchantedVault.tiers.sort((a, b) => a.upTo - b.upTo);
        const totalValue = Object.values(user.vault.purse || {}).reduce((s, a) => s + a, 0) + Object.values(user.vault.experience || {}).reduce((s, a) => s + a, 0);
        const tier = tiers.find(t => totalValue <= t.upTo) || tiers[tiers.length - 1];
        if (!tier) return { updatedUser: user, interestApplied: 0 };

        const processWallet = (wallet, type) => {
            for (const rewardTypeId in wallet) {
                const balance = wallet[rewardTypeId];
                if (balance > 0) {
                    const annualRate = tier.rewardOverrides?.[rewardTypeId] ?? tier.baseInterestRate;
                    const dailyRate = Math.pow(1 + annualRate / 100, 1 / 365) - 1;
                    const interest = balance * dailyRate;
                    if (interest > 0) {
                        wallet[rewardTypeId] += interest;
                        totalInterestApplied += interest;
                        const existing = interestRewards.find(r => r.rewardTypeId === rewardTypeId);
                        if(existing) existing.amount += interest;
                        else interestRewards.push({ rewardTypeId, amount: interest });
                    }
                }
            }
        };
        
        processWallet(user.vault.purse, 'purse');
        processWallet(user.vault.experience, 'experience');
        
        if (totalInterestApplied > 0) {
            user.lastVaultInterestAccrued = today;
            const updatedUser = await manager.save(updateTimestamps(user));
            
            const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
            const rewardsText = interestRewards.map(r => `+${r.amount.toFixed(2)}${(rewardTypes.find(rt => rt.id === r.rewardTypeId)?.icon || '')}`).join(' ');

            await manager.save(ChronicleEventEntity, updateTimestamps(manager.create(ChronicleEventEntity, {
                id: `chron-vinterest-${Date.now()}`, originalId: `vinterest-${Date.now()}`, date: new Date().toISOString(), type: 'VaultInterest',
                title: 'Earned Vault Interest', status: 'Awarded', icon: '📈', color: '#facc15', userId, userName: user.gameName,
                actorId: 'system', actorName: 'System', rewardsText
            }), true));

            updateEmitter.emit('update');
            return { updatedUser, interestApplied: totalInterestApplied };
        }
        
        return { updatedUser: user, interestApplied: 0 };
    });
};


module.exports = {
    getAll, create, clone, update, deleteMany, adjust, getPendingItems, grantRewards,
    generateRewardToken, claimRewardToken,
    depositToVault, withdrawFromVault, accrueInterestForUser,
};
