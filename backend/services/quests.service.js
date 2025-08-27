

const { dataSource } = require('../data-source');
const { QuestEntity, UserEntity, QuestCompletionEntity, RewardTypeDefinitionEntity, UserTrophyEntity, SettingEntity, TrophyEntity, SystemNotificationEntity, ChronicleEventEntity } = require('../entities');
const { In } = require("typeorm");
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps, checkAndAwardTrophies, logAdminAction } = require('../utils/helpers');
const { INITIAL_SETTINGS } = require('../initialData');

const questRepo = dataSource.getRepository(QuestEntity);
const userRepo = dataSource.getRepository(UserEntity);
const completionRepo = dataSource.getRepository(QuestCompletionEntity);

const getAll = async () => {
    const quests = await questRepo.find({ relations: ['assignedUsers'] });
    return quests.map(q => ({ ...q, assignedUserIds: q.assignedUsers.map(u => u.id) }));
};

const create = async (questDataWithUsers, actorId) => {
    return await dataSource.transaction(async manager => {
        const questRepo = manager.getRepository(QuestEntity);
        const userRepo = manager.getRepository(UserEntity);
        const notificationRepo = manager.getRepository(SystemNotificationEntity);

        const { assignedUserIds, ...questData } = questDataWithUsers;
        const newQuest = questRepo.create({
            ...questData,
            id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        });
        if (assignedUserIds && assignedUserIds.length > 0) {
            newQuest.assignedUsers = await userRepo.findBy({ id: In(assignedUserIds) });
        }
        const saved = await questRepo.save(updateTimestamps(newQuest, true));
        
        await logAdminAction(manager, { actorId, title: 'Created Quest', note: `Quest: "${saved.title}"`, icon: '📜', color: '#84cc16', guildId: saved.guildId });

        if (actorId && assignedUserIds && assignedUserIds.length > 0) {
            const actor = await userRepo.findOneBy({ id: actorId });
            if (actor) {
                 const notification = notificationRepo.create({
                    id: `sysnotif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    type: 'QuestAssigned',
                    message: `${actor.gameName} assigned the quest: "${saved.title}"`,
                    recipientUserIds: assignedUserIds,
                    readByUserIds: [],
                    senderId: actorId,
                    timestamp: new Date().toISOString(),
                    link: 'Quests',
                    icon: saved.icon,
                    iconType: saved.iconType,
                    imageUrl: saved.imageUrl,
                    guildId: saved.guildId || undefined,
                });
                await manager.save(updateTimestamps(notification, true));
            }
        }
        
        updateEmitter.emit('update');
        const savedWithRelations = await questRepo.findOne({ where: { id: saved.id }, relations: ['assignedUsers'] });
        const { assignedUsers: users, ...rest } = savedWithRelations;
        return { ...rest, assignedUserIds: users.map(u => u.id) };
    });
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

const update = async (id, questDataWithUsers, actorId) => {
     return await dataSource.transaction(async manager => {
        const questRepo = manager.getRepository(QuestEntity);
        const userRepo = manager.getRepository(UserEntity);
        const notificationRepo = manager.getRepository(SystemNotificationEntity);

        const quest = await questRepo.findOne({ where: { id }, relations: ['assignedUsers'] });
        if (!quest) return null;

        const oldAssignedIds = new Set(quest.assignedUsers.map(u => u.id));

        const { assignedUserIds, ...questData } = questDataWithUsers;
        questRepo.merge(quest, questData);

        if (assignedUserIds) {
            quest.assignedUsers = await userRepo.findBy({ id: In(assignedUserIds) });
        }

        const saved = await questRepo.save(updateTimestamps(quest));

        const newAssignedIds = new Set(quest.assignedUsers.map(u => u.id));
        const newlyAssignedUserIds = [...newAssignedIds].filter(id => !oldAssignedIds.has(id));

        if (actorId && newlyAssignedUserIds.length > 0) {
            const actor = await userRepo.findOneBy({ id: actorId });
             if (actor) {
                 const notification = notificationRepo.create({
                    id: `sysnotif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    type: 'QuestAssigned',
                    message: `${actor.gameName} assigned you the quest: "${saved.title}"`,
                    recipientUserIds: newlyAssignedUserIds,
                    readByUserIds: [],
                    senderId: actorId,
                    timestamp: new Date().toISOString(),
                    link: 'Quests',
                    icon: saved.icon,
                    iconType: saved.iconType,
                    imageUrl: saved.imageUrl,
                    guildId: saved.guildId || undefined,
                });
                await manager.save(updateTimestamps(notification, true));
            }
        }
        
        updateEmitter.emit('update');
        
        const savedWithRelations = await questRepo.findOne({ where: { id: saved.id }, relations: ['assignedUsers'] });
        const { assignedUsers, ...rest } = savedWithRelations;
        return { ...rest, assignedUserIds: assignedUsers.map(u => u.id) };
    });
};

const deleteMany = async (ids, actorId) => {
    await dataSource.transaction(async manager => {
        const questRepo = manager.getRepository(QuestEntity);
        await questRepo.delete(ids);
        await logAdminAction(manager, { actorId, title: `Deleted ${ids.length} Quest(s)`, note: `IDs: ${ids.join(', ')}`, icon: '🗑️', color: '#ef4444' });
    });
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

        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const isPending = savedCompletion.status === 'Pending';
        const eventData = {
            originalId: savedCompletion.id, date: savedCompletion.completedAt, type: 'QuestCompletion',
            title: isPending ? `Submitted "${quest.title}"` : `Completed "${quest.title}"`,
            note: savedCompletion.note, status: savedCompletion.status,
            iconType: quest.iconType, icon: quest.icon, imageUrl: quest.imageUrl, color: isPending ? '#facc15' : '#4ade80',
            userId: user.id, userName: user.gameName,
            actorId: user.id, actorName: user.gameName,
            questType: quest.type, guildId: quest.guildId,
            rewardsText: ''
        };
        const chronicleEvent = chronicleRepo.create({ ...eventData, id: `chron-${savedCompletion.id}`});
        await manager.save(updateTimestamps(chronicleEvent, true));


        const finalCompletion = await manager.findOne(QuestCompletionEntity, { where: { id: savedCompletion.id }, relations: ['user', 'quest'] });
        updateEmitter.emit('update');
        return { updatedUser, newCompletion: finalCompletion };
    });
};

const approveQuestCompletion = async (id, approverId, note) => {
    try {
        console.log(`[APPROVE_QUEST] Starting approval for completionId: ${id}, approverId: ${approverId}`);
        return await dataSource.transaction(async manager => {
            const completion = await manager.findOne(QuestCompletionEntity, { where: { id }, relations: ['user', 'quest'] });
            
            console.log('[APPROVE_QUEST] Fetched completion object:', JSON.stringify(completion, null, 2));
            if (!completion || completion.status !== 'Pending') {
                console.error(`[APPROVE_QUEST] Completion not found or not pending for ID: ${id}`);
                return null;
            }

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
            if (note) completion.adminNote = note;
            
            const updatedCompletion = await manager.save(updateTimestamps(completion));
            
            const { user, quest } = completion;
            
            console.log('[APPROVE_QUEST] User:', user?.gameName, 'Quest:', quest?.title);

            if (user && quest) {
                const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
                const isGuildScope = !!completion.guildId;

                console.log(`[APPROVE_QUEST] User balances BEFORE applying rewards:`, JSON.stringify({ personal: user.personalPurse, guild: user.guildBalances }, null, 2));

                const balances = (() => {
                    if (isGuildScope) {
                        if (!user.guildBalances) user.guildBalances = {};
                        if (!user.guildBalances[completion.guildId]) user.guildBalances[completion.guildId] = { purse: {}, experience: {} };
                        user.guildBalances[completion.guildId].purse = user.guildBalances[completion.guildId].purse || {};
                        user.guildBalances[completion.guildId].experience = user.guildBalances[completion.guildId].experience || {};
                        return user.guildBalances[completion.guildId];
                    }
                    user.personalPurse = user.personalPurse || {};
                    user.personalExperience = user.personalExperience || {};
                    return { purse: user.personalPurse, experience: user.personalExperience };
                })();

                const applyRewards = (rewardsToApply) => {
                    if (!rewardsToApply || !Array.isArray(rewardsToApply)) return;
                    rewardsToApply.forEach(reward => {
                        const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                        if (rewardDef) {
                            const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                            target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
                        }
                    });
                };

                const manuallyAwardedTrophies = [];

                if (quest.type === 'Journey') {
                    console.log('[APPROVE_QUEST] Handling Journey checkpoint.');
                    console.log('[APPROVE_QUEST] Completion checkpointId:', completion.checkpointId);
                    console.log('[APPROVE_QUEST] Quest checkpoints available:', JSON.stringify(quest.checkpoints, null, 2));

                    if (completion.checkpointId && Array.isArray(quest.checkpoints)) {
                        const checkpoint = quest.checkpoints.find(cp => cp && typeof cp === 'object' && cp.id === completion.checkpointId);
                        
                        if (checkpoint) {
                            console.log('[APPROVE_QUEST] Found matching checkpoint:', JSON.stringify(checkpoint, null, 2));
                            applyRewards(checkpoint.rewards);
                            if (checkpoint.trophyId) {
                                const trophyExists = await manager.countBy(TrophyEntity, { id: checkpoint.trophyId });
                                if (trophyExists > 0) {
                                    const newTrophy = manager.create(UserTrophyEntity, {
                                        id: `usertrophy-${Date.now()}-${Math.random()}`, userId: user.id, trophyId: checkpoint.trophyId,
                                        awardedAt: new Date().toISOString(), guildId: quest.guildId || undefined
                                    });
                                    manuallyAwardedTrophies.push(await manager.save(updateTimestamps(newTrophy, true)));
                                }
                            }
                        } else {
                            console.error(`[APPROVE_QUEST] CRITICAL: Checkpoint with ID "${completion.checkpointId}" NOT FOUND in quest "${quest.title}".`);
                            throw new Error(`Checkpoint not found for ID: ${completion.checkpointId}`);
                        }
                    } else {
                         console.warn(`[APPROVE_QUEST] Journey quest approval is missing checkpointId or quest.checkpoints is invalid.`);
                    }

                    const approvedCount = await manager.count(QuestCompletionEntity, { where: { quest: { id: quest.id }, user: { id: user.id }, status: 'Approved' }});
                    const totalCheckpoints = Array.isArray(quest.checkpoints) ? quest.checkpoints.length : 0;
                    
                    // The current completion is now approved, so its included in the count.
                    if (totalCheckpoints > 0 && approvedCount === totalCheckpoints) {
                        console.log(`[APPROVE_QUEST] Final checkpoint approved for Journey "${quest.title}". Applying main quest rewards.`);
                        applyRewards(quest.rewards);
                    }
                } else {
                    applyRewards(quest.rewards);
                }

                const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
                let rewardsText = '';
                if (quest.rewards.length > 0) {
                    rewardsText = quest.rewards.map(r => `+${r.amount}${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
                }
                const approver = await manager.findOneBy(UserEntity, { id: approverId });
                const chronicleRepo = manager.getRepository(ChronicleEventEntity);
                const eventData = {
                    date: completion.actedAt,
                    title: `Completed "${quest.title}"`,
                    note: completion.adminNote || undefined,
                    status: 'Approved',
                    color: '#4ade80',
                    actorId: approverId,
                    actorName: approver?.gameName || 'System',
                    rewardsText: rewardsText || undefined,
                };
                let chronicleEvent = await chronicleRepo.findOneBy({ originalId: completion.id });
                if (chronicleEvent) {
                    chronicleRepo.merge(chronicleEvent, eventData);
                } else {
                    // This case shouldn't happen for approvals, but let's be safe
                    chronicleEvent = chronicleRepo.create({ 
                        ...eventData, 
                        id: `chron-${completion.id}`,
                        originalId: completion.id,
                        type: 'QuestCompletion',
                        userId: completion.user.id,
                        userName: completion.user.gameName,
                        iconType: quest.iconType,
                        icon: quest.icon,
                        imageUrl: quest.imageUrl,
                        questType: quest.type,
                        guildId: quest.guildId
                    });
                }
                await manager.save(updateTimestamps(chronicleEvent));
                
                console.log(`[APPROVE_QUEST] User balances AFTER applying rewards:`, JSON.stringify({ personal: user.personalPurse, guild: user.guildBalances }, null, 2));

                const updatedUser = await manager.save(updateTimestamps(user));
                const { newUserTrophies, newNotifications } = await checkAndAwardTrophies(manager, user.id, completion.guildId);
                
                newUserTrophies.push(...manuallyAwardedTrophies);

                const finalCompletion = await manager.findOne(QuestCompletionEntity, { where: { id: updatedCompletion.id }, relations: ['user', 'quest'] });

                console.log(`[APPROVE_QUEST] Successfully completed approval for completionId: ${id}`);
                updateEmitter.emit('update');
                return { updatedUser, updatedCompletion: finalCompletion, newUserTrophies, newNotifications };
            } else {
                console.error(`[APPROVE_QUEST] User or Quest was missing for completion ID: ${id}`);
                updateEmitter.emit('update');
                return { updatedCompletion };
            }
        });
    } catch (error) {
        console.error(`[APPROVE_QUEST] FATAL ERROR during approval for completionId: ${id}`);
        console.error('[APPROVE_QUEST] Error Message:', error.message);
        console.error('[APPROVE_QUEST] Error Stack:', error.stack);
        throw error; // Re-throw to ensure transaction fails and server returns 500
    }
};

const rejectQuestCompletion = async (id, rejecterId, note) => {
    return await dataSource.transaction(async manager => {
        const completion = await manager.findOne(QuestCompletionEntity, { where: { id }, relations: ['user', 'quest'] });
        if (!completion || completion.status !== 'Pending') return null;
        
        completion.status = 'Rejected';
        completion.actedById = rejecterId;
        completion.actedAt = new Date().toISOString();
        if (note) completion.adminNote = note;
        
        const updatedCompletion = await manager.save(updateTimestamps(completion));

        const rejecter = await manager.findOneBy(UserEntity, { id: rejecterId });
        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const eventData = {
            date: completion.actedAt,
            title: `Rejected "${completion.quest.title}"`,
            note: completion.adminNote,
            status: 'Rejected',
            color: '#f87171',
            actorId: rejecterId,
            actorName: rejecter?.gameName || 'System',
            rewardsText: '',
        };
        let chronicleEvent = await chronicleRepo.findOneBy({ originalId: completion.id });
        if (chronicleEvent) {
            chronicleRepo.merge(chronicleEvent, eventData);
        } else {
             chronicleEvent = chronicleRepo.create({ 
                ...eventData, 
                id: `chron-${completion.id}`,
                originalId: completion.id,
                type: 'QuestCompletion',
                userId: completion.user.id,
                userName: completion.user.gameName,
                iconType: completion.quest.iconType,
                icon: completion.quest.icon,
                imageUrl: completion.quest.imageUrl,
                questType: completion.quest.type,
                guildId: completion.quest.guildId
            });
        }
        await manager.save(updateTimestamps(chronicleEvent));

        updateEmitter.emit('update');
        return { updatedCompletion };
    });
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
        
        const userCompletions = await manager.find(QuestCompletionEntity, {
            where: { quest: { id: questId }, user: { id: userId } }
        });

        const approvedCount = userCompletions.filter(c => c.status === 'Approved').length;

        if (approvedCount >= quest.checkpoints.length) {
            throw new Error('Journey is already fully completed.');
        }

        const hasPending = userCompletions.some(c => c.status === 'Pending');
        if (hasPending) {
            throw new Error('A checkpoint for this journey is already pending approval.');
        }
        
        const checkpoint = quest.checkpoints[approvedCount];
        const now = new Date().toISOString();
        
        const status = quest.requiresApproval ? 'Pending' : 'Approved';
        const note = `Checkpoint ${status.toLowerCase()}: "${checkpoint.description}"`;

        const newCompletion = manager.create(QuestCompletionEntity, {
            id: `qc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            quest: quest,
            user: user,
            completedAt: now,
            status: status,
            note: note,
            guildId: quest.guildId,
            checkpointId: checkpoint.id,
        });
        await manager.save(updateTimestamps(newCompletion, true));
        
        let updatedUser = null;
        let newUserTrophies = [];
        let newNotifications = [];

        if (status === 'Approved') {
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
            updatedUser = await manager.save(updateTimestamps(user));
        }

        // This timestamp is just for display, completion records are the source of truth
        if (!quest.checkpointCompletionTimestamps) quest.checkpointCompletionTimestamps = {};
        if (!quest.checkpointCompletionTimestamps[userId]) quest.checkpointCompletionTimestamps[userId] = {};
        quest.checkpointCompletionTimestamps[userId][checkpoint.id] = now;
        await manager.save(updateTimestamps(quest));
        
        const finalUpdatedQuest = await manager.findOne(QuestEntity, { where: { id: questId }, relations: ['assignedUsers'] });
        const { assignedUsers, ...restOfQuest } = finalUpdatedQuest;
        const updatedQuestForFrontend = { ...restOfQuest, assignedUserIds: assignedUsers.map(u => u.id) };
        const finalCompletion = await manager.findOne(QuestCompletionEntity, { where: { id: newCompletion.id }, relations: ['user', 'quest'] });

        updateEmitter.emit('update');
        return { updatedUser, updatedQuest: updatedQuestForFrontend, newCompletion: finalCompletion, newUserTrophies, newNotifications };
    });
};


module.exports = {
    getAll, create, clone, update, deleteMany, bulkUpdateStatus, bulkUpdate, complete,
    approveQuestCompletion, rejectQuestCompletion, markAsTodo, unmarkAsTodo, completeCheckpoint,
};