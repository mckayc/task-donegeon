const { dataSource } = require('../data-source');
const { QuestEntity, UserEntity, QuestCompletionEntity, RewardTypeDefinitionEntity, UserTrophyEntity, SettingEntity } = require('../entities');
const { In } = require("typeorm");
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps, checkAndAwardTrophies } = require('../utils/helpers');
const { INITIAL_SETTINGS } = require('../initialData');

const questRepo = dataSource.getRepository(QuestEntity);
const userRepo = dataSource.getRepository(UserEntity);
const completionRepo = dataSource.getRepository(QuestCompletionEntity);

const getAll = async () => {
    const quests = await questRepo.find({ relations: ['assignedUsers'] });
    return quests.map(q => ({ ...q, assignedUserIds: q.assignedUsers.map(u => u.id) }));
};

const create = async (questDataWithUsers) => {
    const { assignedUserIds, ...questData } = questDataWithUsers;
    const newQuest = questRepo.create({
        ...questData,
        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    });
    if (assignedUserIds && assignedUserIds.length > 0) {
        newQuest.assignedUsers = await userRepo.findBy({ id: In(assignedUserIds) });
    }
    const saved = await questRepo.save(updateTimestamps(newQuest, true));
    updateEmitter.emit('update');
    return saved;
};

const clone = async (id) => {
    const questToClone = await questRepo.findOne({ where: { id }, relations: ['assignedUsers'] });
    if (!questToClone) return null;

    const newQuest = questRepo.create({
        ...questToClone,
        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: `${questToClone.title} (Copy)`,
        assignedUsers: questToClone.assignedUsers,
    });
    
    const saved = await questRepo.save(updateTimestamps(newQuest, true));
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, questDataWithUsers) => {
    const quest = await questRepo.findOneBy({ id });
    if (!quest) return null;

    const { assignedUserIds, ...questData } = questDataWithUsers;
    questRepo.merge(quest, questData);

    if (assignedUserIds) {
        quest.assignedUsers = await userRepo.findBy({ id: In(assignedUserIds) });
    }

    const saved = await questRepo.save(updateTimestamps(quest));
    updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids) => {
    await questRepo.delete(ids);
    updateEmitter.emit('update');
};

const bulkUpdateStatus = async (ids, isActive) => {
    await questRepo.update(ids, { isActive });
    updateEmitter.emit('update');
};

const bulkUpdate = async (ids, updates) => {
    const updatePayload = {};
    if (typeof updates.isActive === 'boolean') updatePayload.isActive = updates.isActive;
    if (typeof updates.isOptional === 'boolean') updatePayload.isOptional = updates.isOptional;
    if (typeof updates.requiresApproval === 'boolean') updatePayload.requiresApproval = updates.requiresApproval;
    if (updates.groupId !== undefined) updatePayload.groupId = updates.groupId;

    if (Object.keys(updatePayload).length > 0) {
        await questRepo.update(ids, updatePayload);
    }
    
    if (updates.addTags || updates.removeTags || updates.assignUsers || updates.unassignUsers) {
        const questsToUpdate = await questRepo.findBy({ id: In(ids) });
        for (const quest of questsToUpdate) {
            if (updates.addTags) quest.tags = [...new Set([...quest.tags, ...updates.addTags])];
            if (updates.removeTags) quest.tags = quest.tags.filter(t => !updates.removeTags.includes(t));
            if (updates.assignUsers) {
                const usersToAdd = await userRepo.findBy({ id: In(updates.assignUsers) });
                const existingUserIds = new Set(quest.assignedUsers.map(u => u.id));
                quest.assignedUsers.push(...usersToAdd.filter(u => !existingUserIds.has(u.id)));
            }
            if (updates.unassignUsers) {
                quest.assignedUsers = quest.assignedUsers.filter(u => !updates.unassignUsers.includes(u.id));
            }
        }
        await questRepo.save(questsToUpdate);
    }
    updateEmitter.emit('update');
};

const complete = async (completionData) => {
    return await dataSource.transaction(async manager => {
        const newCompletion = manager.create(QuestCompletionEntity, {
            ...completionData,
            id: `qc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        });
        const savedCompletion = await manager.save(updateTimestamps(newCompletion, true));
        
        let updatedUser = null;
        if (completionData.status === 'Approved') {
            const user = await manager.findOneBy(UserEntity, { id: completionData.userId });
            const quest = await manager.findOneBy(QuestEntity, { id: completionData.questId });
            if (user && quest) {
                quest.rewards.forEach(reward => {
                    const rewardType = manager.getRepository(RewardTypeDefinitionEntity).findOneBy({ id: reward.rewardTypeId });
                    const balance = rewardType.category === 'Currency' ? user.personalPurse : user.personalExperience;
                    balance[reward.rewardTypeId] = (balance[reward.rewardTypeId] || 0) + reward.amount;
                });
                updatedUser = await manager.save(updateTimestamps(user));
            }
        }
        updateEmitter.emit('update');
        return { updatedUser, newCompletion: savedCompletion };
    });
};

const approveCompletion = async (id, approverId, note) => {
    return await dataSource.transaction(async manager => {
        const completion = await manager.findOne(QuestCompletionEntity, { where: { id }, relations: ['user', 'quest'] });
        if (!completion || completion.status !== 'Pending') {
            return null;
        }

        const settingRow = await manager.findOneBy(SettingEntity, { id: 1 });
        const settings = settingRow ? settingRow.settings : INITIAL_SETTINGS;
        const isSelfApproval = completion.userId === approverId;

        if (isSelfApproval && !settings.security.allowAdminSelfApproval) {
            const adminCount = await manager.count(UserEntity, { where: { role: 'Donegeon Master' } });
            if (adminCount > 1) {
                throw new Error('Self-approval is disabled. Another administrator must approve this quest.');
            }
        }

        completion.status = 'Approved';
        completion.actedById = approverId;
        completion.actedAt = new Date().toISOString();
        if (note) completion.note = `${completion.note ? `${completion.note}\n` : ''}Approver note: ${note}`;
        
        const updatedCompletion = await manager.save(updateTimestamps(completion));
        const user = completion.user;
        const quest = completion.quest;
        let updatedUser = null;

        if (user && quest) {
            const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
            const isGuildScope = !!completion.guildId;

            if (isGuildScope) {
                if (!user.guildBalances) user.guildBalances = {};
                if (!user.guildBalances[completion.guildId]) {
                    user.guildBalances[completion.guildId] = { purse: {}, experience: {} };
                }
                const balances = user.guildBalances[completion.guildId];
                if (!balances.purse) balances.purse = {};
                if (!balances.experience) balances.experience = {};
                
                quest.rewards.forEach(reward => {
                    const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                    if (rewardDef) {
                        const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                        target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
                    }
                });
            } else {
                if (!user.personalPurse) user.personalPurse = {};
                if (!user.personalExperience) user.personalExperience = {};
                quest.rewards.forEach(reward => {
                    const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                    if (rewardDef) {
                        const target = rewardDef.category === 'Currency' ? user.personalPurse : user.personalExperience;
                        target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
                    }
                });
            }

            updatedUser = await manager.save(updateTimestamps(user));
            const { newUserTrophies, newNotifications } = await checkAndAwardTrophies(manager, user.id, completion.guildId);
            
            updateEmitter.emit('update');
            return { updatedUser, updatedCompletion, newUserTrophies, newNotifications };
        } else {
            updateEmitter.emit('update');
            return { updatedCompletion };
        }
    });
};

const rejectCompletion = async (id, rejecterId, note) => {
    const completion = await completionRepo.findOneBy({ id });
    if (!completion || completion.status !== 'Pending') {
        return null;
    }
    completion.status = 'Rejected';
    completion.actedById = rejecterId;
    completion.actedAt = new Date().toISOString();
    if (note) completion.note = `${completion.note ? `${completion.note}\n` : ''}Rejecter: ${note}`;
    const updatedCompletion = await completionRepo.save(updateTimestamps(completion));
    updateEmitter.emit('update');
    return { updatedCompletion };
};

const markAsTodo = async (questId, userId) => {
    const quest = await questRepo.findOneBy({ id: questId });
    if (!quest) return null;
    
    if (!quest.todoUserIds) quest.todoUserIds = [];
    if (!quest.todoUserIds.includes(userId)) {
        quest.todoUserIds.push(userId);
        const updatedQuest = await questRepo.save(updateTimestamps(quest));
        updateEmitter.emit('update');
        return updatedQuest;
    }
    return quest;
};

const unmarkAsTodo = async (questId, userId) => {
    const quest = await questRepo.findOneBy({ id: questId });
    if (!quest) return null;

    if (quest.todoUserIds && quest.todoUserIds.includes(userId)) {
        quest.todoUserIds = quest.todoUserIds.filter(id => id !== userId);
        const updatedQuest = await questRepo.save(updateTimestamps(quest));
        updateEmitter.emit('update');
        return updatedQuest;
    }
    return quest;
};

const completeCheckpoint = async (questId, userId) => {
    return await dataSource.transaction(async manager => {
        const quest = await manager.findOneBy(QuestEntity, { id: questId });
        const user = await manager.findOneBy(UserEntity, { id: userId });

        if (!quest || !user || quest.type !== 'Journey' || !quest.checkpoints) {
            throw new Error('Valid journey quest and user not found.');
        }
        
        if (!quest.checkpointCompletions) quest.checkpointCompletions = {};
        
        const completedCount = quest.checkpointCompletions[userId] || 0;
        const totalCheckpoints = quest.checkpoints.length;

        if (completedCount >= totalCheckpoints) {
            throw new Error('Journey already completed.');
        }

        const currentCheckpoint = quest.checkpoints[completedCount];
        
        // Award Rewards
        const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
        const isGuildScope = !!quest.guildId;
        let balances = isGuildScope ? user.guildBalances[quest.guildId] : { purse: user.personalPurse, experience: user.personalExperience };
        if (!balances) {
            balances = { purse: {}, experience: {} };
            if (isGuildScope) user.guildBalances[quest.guildId] = balances;
        }
        if (!balances.purse) balances.purse = {};
        if (!balances.experience) balances.experience = {};

        currentCheckpoint.rewards.forEach(reward => {
            const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
            if (rewardDef) {
                const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
            }
        });

        // Update Quest Progress
        quest.checkpointCompletions[userId] = completedCount + 1;
        
        const isFinalCheckpoint = (completedCount + 1) === totalCheckpoints;
        let newCompletion = null;
        if (isFinalCheckpoint) {
            newCompletion = manager.create(QuestCompletionEntity, {
                id: `qc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                userId: userId,
                questId: questId,
                completedAt: new Date().toISOString(),
                status: 'Approved',
                note: 'Journey Completed!',
                guildId: quest.guildId
            });
            await manager.save(updateTimestamps(newCompletion, true));
        }

        const updatedQuest = await manager.save(updateTimestamps(quest));
        const updatedUser = await manager.save(updateTimestamps(user));

        // Award Trophy
        let newUserTrophy = null;
        if (currentCheckpoint.trophyId) {
            const newTrophy = manager.create(UserTrophyEntity, {
                id: `usertrophy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                userId,
                trophyId: currentCheckpoint.trophyId,
                awardedAt: new Date().toISOString(),
                guildId: quest.guildId || null
            });
            newUserTrophy = await manager.save(updateTimestamps(newTrophy, true));
        }
        
        const { newUserTrophies, newNotifications } = await checkAndAwardTrophies(manager, user.id, quest.guildId);
        if (newUserTrophy) newUserTrophies.push(newUserTrophy);

        updateEmitter.emit('update');
        return { updatedUser, updatedQuest, newCompletion, newUserTrophies, newNotifications };
    });
};

module.exports = {
    getAll,
    create,
    clone,
    update,
    deleteMany,
    bulkUpdateStatus,
    bulkUpdate,
    complete,
    approveCompletion,
    rejectCompletion,
    markAsTodo,
    unmarkAsTodo,
    completeCheckpoint,
};