const { dataSource } = require('../data-source');
const { QuestEntity, UserEntity, QuestCompletionEntity, RewardTypeDefinitionEntity, UserTrophyEntity, SettingEntity, TrophyEntity, SystemNotificationEntity, ChronicleEventEntity } = require('../entities');
const { In, Between } = require("typeorm");
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps, checkAndAwardTrophies, logGeneralAdminAction } = require('../utils/helpers');
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
        
        await logGeneralAdminAction(manager, { actorId, title: 'Created Quest', note: `Quest: "${saved.title}"`, icon: '📜', color: '#84cc16', guildId: saved.guildId });

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
        await logGeneralAdminAction(manager, { actorId, title: `Deleted ${ids.length} Quest(s)`, note: `IDs: ${ids.join(', ')}`, icon: '🗑️', color: '#ef4444' });
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

        // Validation for duty quests to prevent multiple completions on the same day.
        if (quest.type === 'Duty') {
            const today = new Date(completionData.completedAt);
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
            
            const existingCompletionTodayCount = await manager.getRepository(QuestCompletionEntity).count({
                where: {
                    user: { id: user.id },
                    quest: { id: quest.id },
                    status: In(['Approved', 'Pending']),
                    completedAt: Between(startOfDay.toISOString(), endOfDay.toISOString())
                }
            });

            if (existingCompletionTodayCount > 0) {
                console.warn(`User ${user.id} attempted to complete duty ${quest.id} again today.`);
                throw new Error('This duty has already been completed or is pending approval for today.');
            }
        }

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
            // Auto-release claim if applicable
            if (quest.requiresClaim && quest.approvedClaims?.some(c => c.userId === user.id)) {
                quest.approvedClaims = quest.approvedClaims.filter(c => c.userId !== user.id);
                await manager.save(QuestEntity, updateTimestamps(quest));
            }

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
        return await dataSource.transaction(async manager => {
            const completion = await manager.findOne(QuestCompletionEntity, { where: { id }, relations: ['user', 'quest'] });
            
            if (!completion || completion.status !== 'Pending') {
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
            let updatedUser = null;
            const newUserTrophies = [];
            const newNotifications = [];

            if (user && quest) {
                // Auto-release claim if applicable
                if (quest.requiresClaim && quest.approvedClaims?.some(c => c.userId === user.id)) {
                    quest.approvedClaims = quest.approvedClaims.filter(c => c.userId !== user.id);
                    await manager.save(QuestEntity, updateTimestamps(quest));
                }

                const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
                const isGuildScope = !!completion.guildId;

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

                if (quest.type === 'Journey') {
                    if (completion.checkpointId && Array.isArray(quest.checkpoints)) {
                        const checkpoint = quest.checkpoints.find(cp => cp && typeof cp === 'object' && cp.id === completion.checkpointId);
                        
                        if (checkpoint) {
                            applyRewards(checkpoint.rewards);
                            if (checkpoint.trophyId) {
                                const trophyExists = await manager.countBy(TrophyEntity, { id: checkpoint.trophyId });
                                if (trophyExists > 0) {
                                    const newTrophy = manager.create(UserTrophyEntity, {
                                        id: `usertrophy-${Date.now()}-${Math.random()}`, userId: user.id, trophyId: checkpoint.trophyId,
                                        awardedAt: new Date().toISOString(), guildId: quest.guildId || undefined
                                    });
                                    newUserTrophies.push(await manager.save(updateTimestamps(newTrophy, true)));
                                }
                            }
                        } else {
                            console.error(`CRITICAL: Checkpoint with ID "${completion.checkpointId}" NOT FOUND in quest "${quest.title}".`);
                            throw new Error(`Checkpoint not found for ID: ${completion.checkpointId}`);
                        }
                    }

                    const approvedCount = await manager.count(QuestCompletionEntity, { where: { quest: { id: quest.id }, user: { id: user.id }, status: 'Approved' }});
                    const totalCheckpoints = Array.isArray(quest.checkpoints) ? quest.checkpoints.length : 0;
                    
                    if (totalCheckpoints > 0 && approvedCount === totalCheckpoints) {
                        applyRewards(quest.rewards);
                    }
                } else {
                    applyRewards(quest.rewards);
                }
                
                updatedUser = await manager.save(updateTimestamps(user));
                const autoAwards = await checkAndAwardTrophies(manager, user.id, completion.guildId);
                newUserTrophies.push(...autoAwards.newUserTrophies);
                newNotifications.push(...autoAwards.newNotifications);
                
                // Chronicle Logging moved to the end for consistency
                const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
                let rewardsText = '';
                if (quest.rewards.length > 0) {
                    rewardsText = quest.rewards.map(r => `+${r.amount}${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
                }
                const approver = await manager.findOneBy(UserEntity, { id: approverId });
                
                const eventData = {
                    id: `chron-approve-${completion.id}`,
                    originalId: completion.id, date: completion.actedAt, type: 'QuestCompletion',
                    title: `Approved "${quest.title}"`, note: completion.adminNote || undefined,
                    status: 'Approved', color: '#4ade80', userId: user.id, userName: user.gameName,
                    actorId: approverId, actorName: approver?.gameName || 'System',
                    questType: quest.type, guildId: quest.guildId,
                    rewardsText: rewardsText || undefined, iconType: quest.iconType, icon: quest.icon, imageUrl: quest.imageUrl
                };
                
                await manager.save(ChronicleEventEntity, updateTimestamps(manager.create(ChronicleEventEntity, eventData), true));
                
                const finalCompletion = await manager.findOne(QuestCompletionEntity, { where: { id: updatedCompletion.id }, relations: ['user', 'quest'] });

                updateEmitter.emit('update');
                return { updatedUser, updatedCompletion: finalCompletion, newUserTrophies, newNotifications };
            } else {
                updateEmitter.emit('update');
                return { updatedCompletion };
            }
        });
    } catch (error) {
        console.error(`[APPROVE_QUEST] FATAL ERROR during approval for completionId: ${id}`, error);
        throw error;
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

        // Chronicle Logging moved to the end for consistency
        const rejecter = await manager.findOneBy(UserEntity, { id: rejecterId });
        const eventData = {
            id: `chron-reject-${completion.id}`, originalId: completion.id, date: completion.actedAt,
            type: 'QuestCompletion', title: `Rejected "${completion.quest.title}"`, note: completion.adminNote,
            status: 'Rejected', color: '#f87171', userId: completion.user.id, userName: completion.user.gameName,
            actorId: rejecterId, actorName: rejecter?.gameName || 'System',
            rewardsText: '', iconType: completion.quest.iconType, icon: completion.quest.icon,
            imageUrl: completion.quest.imageUrl, questType: completion.quest.type, guildId: completion.quest.guildId
        };
        await manager.save(ChronicleEventEntity, updateTimestamps(manager.create(ChronicleEventEntity, eventData), true));

        updateEmitter.emit('update');
        return { updatedCompletion };
    });
};

const markAsTodo = async (questId, userId) => {
    return await dataSource.transaction(async manager => {
        const questRepo = manager.getRepository(QuestEntity);
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
    });
};

const unmarkAsTodo = async (questId, userId) => {
    return await dataSource.transaction(async manager => {
        const questRepo = manager.getRepository(QuestEntity);
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
    });
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

const claimQuest = async (questId, userId) => {
    return await dataSource.transaction(async manager => {
        const questRepo = manager.getRepository(QuestEntity);
        const quest = await questRepo.findOne({ where: { id: questId }, relations: ['assignedUsers']});
        if (!quest || !quest.requiresClaim) return null;

        if (!quest.pendingClaims) quest.pendingClaims = [];
        if (quest.pendingClaims.some(c => c.userId === userId)) return { ...quest, assignedUserIds: quest.assignedUsers.map(u => u.id) }; // Already pending

        quest.pendingClaims.push({ userId, claimedAt: new Date().toISOString() });
        const saved = await questRepo.save(updateTimestamps(quest));
        
        const user = await manager.findOneBy(UserEntity, { id: userId });
        await manager.save(ChronicleEventEntity, updateTimestamps(manager.getRepository(ChronicleEventEntity).create({
            id: `chron-claim-${quest.id}-${userId}-${Date.now()}`,
            originalId: quest.id, date: new Date().toISOString(), type: 'QuestClaimed',
            title: `Claimed "${quest.title}"`, status: 'Pending', icon: '🤔',
            color: '#facc15', userId: userId, userName: user?.gameName,
            actorId: userId, actorName: user?.gameName, guildId: quest.guildId
        }), true));

        updateEmitter.emit('update');
        const { assignedUsers: users, ...rest } = saved;
        return { ...rest, assignedUserIds: users.map(u => u.id) };
    });
};

const unclaimQuest = async (questId, userId) => {
    return await dataSource.transaction(async manager => {
        const questRepo = manager.getRepository(QuestEntity);
        const quest = await questRepo.findOne({where: { id: questId }, relations: ['assignedUsers']});
        if (!quest) return null;

        const wasPending = quest.pendingClaims?.some(c => c.userId === userId);
        const wasApproved = quest.approvedClaims?.some(c => c.userId === userId);
        let changed = false;

        if (wasPending) {
            quest.pendingClaims = quest.pendingClaims.filter(c => c.userId !== userId);
            changed = true;
        }
        if (wasApproved) {
            quest.approvedClaims = quest.approvedClaims.filter(c => c.userId !== userId);
            changed = true;
        }

        if (changed) {
            const saved = await questRepo.save(updateTimestamps(quest));

            const user = await manager.findOneBy(UserEntity, { id: userId });
            const eventType = wasPending ? 'QuestClaimCancelled' : 'QuestUnclaimed';
            const eventTitle = wasPending ? `Cancelled claim for "${quest.title}"` : `Unclaimed "${quest.title}"`;
            const eventIcon = wasPending ? '❌' : '↩️';
            await manager.save(ChronicleEventEntity, updateTimestamps(manager.getRepository(ChronicleEventEntity).create({
                id: `chron-unclaim-${quest.id}-${userId}-${Date.now()}`,
                originalId: quest.id, date: new Date().toISOString(), type: eventType,
                title: eventTitle, status: wasPending ? 'Cancelled' : 'Unclaimed', icon: eventIcon,
                color: '#a8a29e', userId: userId, userName: user?.gameName,
                actorId: userId, actorName: user?.gameName, guildId: quest.guildId
            }), true));

            updateEmitter.emit('update');
            const { assignedUsers: users, ...rest } = saved;
            return { ...rest, assignedUserIds: users.map(u => u.id) };
        }
        
        const { assignedUsers, ...restOfQuest } = quest;
        return { ...restOfQuest, assignedUserIds: assignedUsers ? assignedUsers.map(u => u.id) : [] };
    });
};

const approveClaim = async (questId, userId, adminId) => {
    return await dataSource.transaction(async manager => {
        const questRepo = manager.getRepository(QuestEntity);
        const quest = await questRepo.findOne({ where: { id: questId }, relations: ['assignedUsers']});
        if (!quest || !quest.requiresClaim) return null;
        
        const pendingClaim = quest.pendingClaims?.find(c => c.userId === userId);
        if (!pendingClaim) return null; // No pending claim to approve

        if (!quest.approvedClaims) quest.approvedClaims = [];
        quest.approvedClaims.push({ userId, claimedAt: pendingClaim.claimedAt, approvedBy: adminId, approvedAt: new Date().toISOString() });
        quest.pendingClaims = quest.pendingClaims.filter(c => c.userId !== userId);

        const saved = await questRepo.save(updateTimestamps(quest));
        
        const user = await manager.findOneBy(UserEntity, { id: userId });
        const admin = await manager.findOneBy(UserEntity, { id: adminId });
        await manager.save(ChronicleEventEntity, updateTimestamps(manager.getRepository(ChronicleEventEntity).create({
            id: `chron-approveclaim-${quest.id}-${userId}-${Date.now()}`,
            originalId: quest.id, date: new Date().toISOString(), type: 'QuestClaimApproved',
            title: `Claim approved for "${quest.title}"`, status: 'Approved', icon: '👍',
            color: '#4ade80', userId: userId, userName: user?.gameName,
            actorId: adminId, actorName: admin?.gameName, guildId: quest.guildId
        }), true));

        updateEmitter.emit('update');
        const { assignedUsers: users, ...rest } = saved;
        return { ...rest, assignedUserIds: users.map(u => u.id) };
    });
}

const rejectClaim = async (questId, userId, adminId) => {
    return await dataSource.transaction(async manager => {
        const questRepo = manager.getRepository(QuestEntity);
        const quest = await questRepo.findOne({ where: { id: questId }, relations: ['assignedUsers']});
        if (!quest || !quest.requiresClaim || !quest.pendingClaims?.some(c => c.userId === userId)) return null;

        quest.pendingClaims = quest.pendingClaims.filter(c => c.userId !== userId);
        
        const saved = await questRepo.save(updateTimestamps(quest));

        const user = await manager.findOneBy(UserEntity, { id: userId });
        const admin = await manager.findOneBy(UserEntity, { id: adminId });
        await manager.save(ChronicleEventEntity, updateTimestamps(manager.getRepository(ChronicleEventEntity).create({
            id: `chron-rejectclaim-${quest.id}-${userId}-${Date.now()}`,
            originalId: quest.id, date: new Date().toISOString(), type: 'QuestClaimRejected',
            title: `Claim rejected for "${quest.title}"`, status: 'Rejected', icon: '👎',
            color: '#f87171', userId: userId, userName: user?.gameName,
            actorId: adminId, actorName: admin?.gameName, guildId: quest.guildId
        }), true));
        
        updateEmitter.emit('update');
        const { assignedUsers: users, ...rest } = saved;
        return { ...rest, assignedUserIds: users.map(u => u.id) };
    });
}

const logReadingTime = async (questId, userId, seconds) => {
    const quest = await questRepo.findOneBy({ id: questId });
    if (!quest) return null;

    if (!quest.readingProgress) {
        quest.readingProgress = {};
    }

    quest.readingProgress[userId] = (quest.readingProgress[userId] || 0) + seconds;

    const saved = await questRepo.save(updateTimestamps(quest));
    updateEmitter.emit('update');
    return saved;
};


module.exports = {
    getAll, create, clone, update, deleteMany, bulkUpdateStatus, bulkUpdate, complete,
    approveQuestCompletion, rejectQuestCompletion, markAsTodo, unmarkAsTodo, completeCheckpoint,
    claimQuest, unclaimQuest, approveClaim, rejectClaim, logReadingTime,
};