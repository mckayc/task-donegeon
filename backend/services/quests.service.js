
const { dataSource } = require('../data-source');
const { QuestEntity, UserEntity, QuestCompletionEntity, RewardTypeDefinitionEntity, UserTrophyEntity, SettingEntity, TrophyEntity } = require('../entities');
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
    const savedWithRelations = await questRepo.findOne({ where: { id: saved.id }, relations: ['assignedUsers'] });
    const { assignedUsers: users, ...rest } = savedWithRelations;
    return { ...rest, assignedUserIds: users.map(u => u.id) };
};

const clone = async (id) => {
    const questToClone = await questRepo.findOne({ where: { id }, relations: ['assignedUsers'] });
    if (!questToClone) return null;

    const newQuest = questRepo.create({
        ...questToClone,
        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: `${questToClone.title} (Copy)`,
    });
    
    const saved = await questRepo.save(updateTimestamps(newQuest, true));
    updateEmitter.emit('update');
    const { assignedUsers, ...rest } = saved;
    return { ...rest, assignedUserIds: assignedUsers.map(u => u.id) };
};

const update = async (id, questDataWithUsers) => {
    const quest = await questRepo.findOne({ where: { id }, relations: ['assignedUsers'] });
    if (!quest) return null;

    const { assignedUserIds, ...questData } = questDataWithUsers;
    questRepo.merge(quest, questData);

    if (assignedUserIds) {
        quest.assignedUsers = await userRepo.findBy({ id: In(assignedUserIds) });
    }

    const saved = await questRepo.save(updateTimestamps(quest));
    updateEmitter.emit('update');
    
    const savedWithRelations = await questRepo.findOne({ where: { id: saved.id }, relations: ['assignedUsers'] });
    const { assignedUsers, ...rest } = savedWithRelations;
    return { ...rest, assignedUserIds: assignedUsers.map(u => u.id) };
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
    const questsToUpdate = await questRepo.find({ where: { id: In(ids) }, relations: ['assignedUsers'] });
    if (questsToUpdate.length === 0) return;

    for (const quest of questsToUpdate) {
        if (typeof updates.isActive === 'boolean') quest.isActive = updates.isActive;
        if (typeof updates.isOptional === 'boolean') quest.isOptional = updates.isOptional;
        if (typeof updates.requiresApproval === 'boolean') quest.requiresApproval = updates.requiresApproval;
        if (updates.groupId !== undefined) quest.groupId = updates.groupId;
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
    await questRepo.save(questsToUpdate.map(q => updateTimestamps(q)));
    updateEmitter.emit('update');
};

const complete = async (completionData) => {
    return await dataSource.transaction(async manager => {
        const user = await manager.findOneBy(UserEntity, { id: completionData.userId });
        const quest = await manager.findOneBy(QuestEntity, { id: completionData.questId });
        if (!user || !quest) throw new Error('User or Quest not found');

        const newCompletionData = { ...completionData, user, quest };
        delete newCompletionData.userId;
        delete newCompletionData.questId;

        const newCompletion = manager.create(QuestCompletionEntity, {
            ...newCompletionData,
            id: `qc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        });
        const savedCompletion = await manager.save(updateTimestamps(newCompletion, true));
        
        let updatedUser = null;
        if (completionData.status === 'Approved') {
            const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
            const isGuildScope = !!completionData.guildId;
            const balances = isGuildScope ? user.guildBalances[completionData.guildId] || { purse: {}, experience: {} } : { purse: user.personalPurse, experience: user.personalExperience };
            
            quest.rewards.forEach(reward => {
                const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                if (rewardDef) {
                    const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                    target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
                }
            });

            if(isGuildScope) user.guildBalances[completionData.guildId] = balances;

            updatedUser = await manager.save(updateTimestamps(user));
        }

        const finalCompletion = await manager.findOne(QuestCompletionEntity, { where: { id: savedCompletion.id }, relations: ['user', 'quest'] });
        updateEmitter.emit('update');
        return { updatedUser, newCompletion: finalCompletion };
    });
};

const approveCompletion = async (id, approverId, note) => {
    return await dataSource.transaction(async manager => {
        const completion = await manager.findOne(QuestCompletionEntity, { where: { id }, relations: ['user', 'quest'] });
        if (!completion || completion.status !== 'Pending') return null;

        const settingRow = await manager.findOneBy(SettingEntity, { id: 1 });
        const settings = settingRow ? settingRow.settings : INITIAL_SETTINGS;
        const isSelfApproval = completion.user.id === approverId;

        if (isSelfApproval && !settings.security.allowAdminSelfApproval) {
            const adminCount = await manager.count(UserEntity, { where: { role: 'Donegeon Master' } });
            if (adminCount > 1) throw new Error('Self-approval is disabled. Another administrator must approve this quest.');
        }

        completion.status = 'Approved';
        completion.actedById = approverId;
        completion.actedAt = new Date().toISOString();
        if (note) completion.note = `${completion.note ? `${completion.note}\n` : ''}Approver note: ${note}`;
        
        const updatedCompletion = await manager.save(updateTimestamps(completion));
        const { user, quest } = completion;
        
        if (user && quest) {
            const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
            const isGuildScope = !!completion.guildId;

            const balances = isGuildScope ? user.guildBalances[completion.guildId] || { purse: {}, experience: {} } : { purse: user.personalPurse, experience: user.personalExperience };
            quest.rewards.forEach(reward => {
                const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                if (rewardDef) {
                    const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                    target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
                }
            });

            if(isGuildScope) user.guildBalances[completion.guildId] = balances;

            const updatedUser = await manager.save(updateTimestamps(user));
            const { newUserTrophies, newNotifications } = await checkAndAwardTrophies(manager, user.id, completion.guildId);
            const finalCompletion = await manager.findOne(QuestCompletionEntity, { where: { id: updatedCompletion.id }, relations: ['user', 'quest'] });

            updateEmitter.emit('update');
            return { updatedUser, updatedCompletion: finalCompletion, newUserTrophies, newNotifications };
        } else {
            updateEmitter.emit('update');
            return { updatedCompletion };
        }
    });
};

const rejectCompletion = async (id, rejecterId, note) => {
    const completion = await completionRepo.findOne({ where: { id }, relations: ['user', 'quest'] });
    if (!completion || completion.status !== 'Pending') return null;
    
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
        await questRepo.save(updateTimestamps(quest));
        updateEmitter.emit('update');
    }
    
    const updatedQuestWithRelations = await questRepo.findOne({ where: { id: questId }, relations: ['assignedUsers'] });
    if (!updatedQuestWithRelations) return null;
    
    const { assignedUsers, ...rest } = updatedQuestWithRelations;
    return { ...rest, assignedUserIds: assignedUsers.map(u => u.id) };
};

const unmarkAsTodo = async (questId, userId) => {
    const quest = await questRepo.findOneBy({ id: questId });
    if (!quest) return null;

    if (quest.todoUserIds && quest.todoUserIds.includes(userId)) {
        quest.todoUserIds = quest.todoUserIds.filter(id => id !== userId);
        await questRepo.save(updateTimestamps(quest));
        updateEmitter.emit('update');
    }

    const updatedQuestWithRelations = await questRepo.findOne({ where: { id: questId }, relations: ['assignedUsers'] });
    if (!updatedQuestWithRelations) return null;

    const { assignedUsers, ...rest } = updatedQuestWithRelations;
    return { ...rest, assignedUserIds: assignedUsers.map(u => u.id) };
};

const completeCheckpoint = async (questId, userId) => {
    return await dataSource.transaction(async manager => {
        const user = await manager.findOneBy(UserEntity, { id: userId });
        const quest = await manager.findOneBy(QuestEntity, { id: questId });
        if (!user || !quest) throw new Error('User or Quest not found');

        if (!quest.checkpoints || quest.checkpoints.length === 0) {
            throw new Error('Quest is not a valid Journey or has no checkpoints.');
        }
        
        const completedCount = Object.keys(quest.checkpointCompletionTimestamps?.[userId] || {}).length;
        if (completedCount >= quest.checkpoints.length) {
            throw new Error('Journey is already fully completed.');
        }

        const checkpoint = quest.checkpoints[completedCount];
        const now = new Date().toISOString();

        if (!quest.checkpointCompletionTimestamps) {
            quest.checkpointCompletionTimestamps = {};
        }
        if (!quest.checkpointCompletionTimestamps[userId]) {
            quest.checkpointCompletionTimestamps[userId] = {};
        }
        quest.checkpointCompletionTimestamps[userId][checkpoint.id] = now;

        const newCompletion = manager.create(QuestCompletionEntity, {
            id: `qc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            quest: quest,
            user: user,
            completedAt: now,
            status: 'Approved',
            note: `Completed checkpoint: "${checkpoint.description}"`,
            guildId: quest.guildId
        });
        await manager.save(updateTimestamps(newCompletion, true));
        
        const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
        const isGuildScope = !!quest.guildId;
        const balances = isGuildScope ? user.guildBalances[quest.guildId] || { purse: {}, experience: {} } : { purse: user.personalPurse, experience: user.personalExperience };
            
        checkpoint.rewards.forEach(reward => {
            const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
            if (rewardDef) {
                const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
            }
        });
        if (isGuildScope) user.guildBalances[quest.guildId] = balances;

        let newUserTrophies = [];
        let newNotifications = [];
        if (checkpoint.trophyId) {
            const trophy = await manager.findOneBy(TrophyEntity, { id: checkpoint.trophyId });
            if (trophy) {
                const newTrophy = manager.create(UserTrophyEntity, {
                    id: `usertrophy-${Date.now()}`,
                    userId,
                    trophyId: trophy.id,
                    awardedAt: now,
                    guildId: quest.guildId || undefined,
                });
                const saved = await manager.save(updateTimestamps(newTrophy, true));
                newUserTrophies.push(saved);
            }
        }
        
        const updatedUser = await manager.save(updateTimestamps(user));
        await manager.save(updateTimestamps(quest));
        
        // **BUG FIX**: Refetch the quest with its relations before returning
        const finalUpdatedQuest = await manager.findOne(QuestEntity, { where: { id: questId }, relations: ['assignedUsers'] });
        const { assignedUsers, ...restOfQuest } = finalUpdatedQuest;
        const updatedQuestForFrontend = { ...restOfQuest, assignedUserIds: assignedUsers.map(u => u.id) };

        updateEmitter.emit('update');
        return { updatedUser, updatedQuest: updatedQuestForFrontend, newCompletion, newUserTrophies, newNotifications };
    });
};

module.exports = {
    getAll, create, clone, update, deleteMany, bulkUpdateStatus, bulkUpdate, complete,
    approveCompletion, rejectCompletion, markAsTodo, unmarkAsTodo, completeCheckpoint,
};
