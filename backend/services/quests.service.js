

const { dataSource } = require('../data-source');
const { QuestEntity, UserEntity, QuestCompletionEntity, RewardTypeDefinitionEntity, UserTrophyEntity, SettingEntity, TrophyEntity, SystemNotificationEntity, ChronicleEventEntity, ScheduledEventEntity } = require('../entities');
const { In, Between } = require("typeorm");
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps, logGeneralAdminAction } = require('../utils/helpers');
const { INITIAL_SETTINGS } = require('../initialData');
const userService = require('./user.service');

const questRepo = dataSource.getRepository(QuestEntity);
const userRepo = dataSource.getRepository(UserEntity);
const completionRepo = dataSource.getRepository(QuestCompletionEntity);

const toYMD = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isVacationActiveOnDate = (date, scheduledEvents, guildId) => {
    const dateKey = toYMD(date);
    return scheduledEvents.some(event => {
        if (event.eventType !== 'Vacation') return false;
        const scopeMatch = !event.guildId || event.guildId === guildId;
        if (!scopeMatch) return false;
        return dateKey >= event.startDate && dateKey <= event.endDate;
    });
};

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
        if (updates.groupId !== undefined) quest.groupIds = updates.groupId ? [updates.groupId] : [];
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

        // Server-side deadline validation
        const scheduledEvents = await manager.find(ScheduledEventEntity);
        const completionTime = new Date(completionData.completedAt);
        const onVacation = isVacationActiveOnDate(completionTime, scheduledEvents, quest.guildId);

        // Check Duty incomplete time
        if (quest.type === 'Duty' && quest.endTime && !onVacation) {
            const [hours, minutes] = quest.endTime.split(':').map(Number);
            const deadlineToday = new Date(completionTime);
            deadlineToday.setHours(hours, minutes, 0, 0);

            if (completionTime > deadlineToday) {
                throw new Error(`Quest "${quest.title}" is incomplete for the day and can no longer be completed.`);
            }
        }

        // Check Venture/Journey final deadline
        if ((quest.type === 'Venture' || quest.type === 'Journey') && quest.endDateTime && !onVacation) {
            const deadline = new Date(quest.endDateTime);
            if (completionTime > deadline) {
                 throw new Error(`Quest "${quest.title}" is past its deadline and can no longer be completed.`);
            }
        }

        // Validation for duty quests to prevent multiple completions on the same day.
        if (quest.type === 'Duty') {
            const today = new Date(completionData.completedAt);
            const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
            const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
            
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
            if (quest.requiresClaim && quest.approvedClaims?.some(c => c.userId === user.id)) {
                quest.approvedClaims = quest.approvedClaims.filter(c => c.userId !== user.id);
                await manager.save(QuestEntity, updateTimestamps(quest));
            }
            
            const grantDetails = {
                userId: user.id,
                rewards: quest.rewards,
                actorId: user.id,
                actorName: user.gameName,
                chronicleTitle: `Completed "${quest.title}"`,
                chronicleNote: savedCompletion.note,
                chronicleType: 'QuestCompletion',
                chronicleIcon: quest.icon,
                chronicleColor: '#4ade80',
                originalId: savedCompletion.id,
            };

            const grantResult = await userService.grantRewards(manager, grantDetails);
            updatedUser = grantResult.updatedUser;
        } else { // Pending
             const chronicleRepo = manager.getRepository(ChronicleEventEntity);
             const eventData = {
                originalId: savedCompletion.id, date: savedCompletion.completedAt, type: 'QuestCompletion',
                title: `Submitted "${quest.title}"`, note: savedCompletion.note, status: 'Pending',
                icon: quest.icon, color: '#facc15', userId: user.id, userName: user.gameName,
                actorId: user.id, actorName: user.gameName, questType: quest.type, guildId: quest.guildId,
            };
            const chronicleEvent = chronicleRepo.create({ ...eventData, id: `chron-${savedCompletion.id}`});
            await manager.save(updateTimestamps(chronicleEvent, true));
        }

        const finalCompletion = await manager.findOne(QuestCompletionEntity, { where: { id: savedCompletion.id }, relations: ['user', 'quest'] });
        updateEmitter.emit('update');
        return { updatedUser, newCompletion: finalCompletion };
    });
};

const approveQuestCompletion = async (id, approverId, note) => {
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
        if (note) completion.adminNote = note;
        const updatedCompletion = await manager.save(updateTimestamps(completion));

        const { user, quest } = completion;
        let rewardsToApply = [];
        let trophyIdToApply;
        let isFinalCompletion = false;
        let chronicleTitle = `Completed "${quest.title}"`;
        let chronicleType = 'QuestCompletion';

        if (quest.type === 'Journey') {
            const checkpoint = (quest.checkpoints || []).find(cp => cp.id === completion.checkpointId);
            if (checkpoint) {
                rewardsToApply = checkpoint.rewards || [];
                trophyIdToApply = checkpoint.trophyId;
                chronicleTitle = `Checkpoint for "${quest.title}"`;
                chronicleType = 'Checkpoint';
            }
            const approvedCount = await manager.count(QuestCompletionEntity, { where: { quest: { id: quest.id }, user: { id: user.id }, status: 'Approved' } });
            const totalCheckpoints = quest.checkpoints?.length || 0;
            if (totalCheckpoints > 0 && approvedCount >= totalCheckpoints) {
                rewardsToApply = [...rewardsToApply, ...(quest.rewards || [])];
                isFinalCompletion = true;
                chronicleTitle = `Completed Journey: "${quest.title}"`;
                chronicleType = 'QuestCompletion';
            }
        } else {
            rewardsToApply = quest.rewards || [];
            isFinalCompletion = true;
        }

        const approver = await manager.findOneBy(UserEntity, { id: approverId });
        
        const grantDetails = {
            userId: user.id,
            rewards: rewardsToApply,
            trophyId: trophyIdToApply,
            actorId: approverId,
            actorName: approver?.gameName || 'System',
            chronicleTitle,
            chronicleNote: note,
            chronicleType,
            chronicleIcon: quest.icon,
            chronicleColor: '#4ade80',
            originalId: completion.id,
            guildId: undefined, // Personal scope
        };

        const { updatedUser, newUserTrophies, newNotifications } = await userService.grantRewards(manager, grantDetails);

        const notification = manager.create(SystemNotificationEntity, {
            id: `sysnotif-approve-${completion.id}`,
            type: 'QuestApproved',
            message: `${approver.gameName} approved your completion of "${quest.title}".`,
            recipientUserIds: [user.id],
            readByUserIds: [],
            senderId: approverId,
            timestamp: new Date().toISOString(),
            link: 'Chronicles',
            icon: quest.icon,
            iconType: quest.iconType,
            imageUrl: quest.imageUrl,
            guildId: undefined, // Personal scope
        });
        const savedNotification = await manager.save(updateTimestamps(notification, true));
        newNotifications.push(savedNotification);
        
        if (isFinalCompletion && quest.requiresClaim && quest.approvedClaims?.some(c => c.userId === user.id)) {
            quest.approvedClaims = quest.approvedClaims.filter(c => c.userId !== user.id);
            await manager.save(QuestEntity, updateTimestamps(quest));
        }

        updateEmitter.emit('update');
        const finalCompletion = await manager.findOne(QuestCompletionEntity, { where: { id: updatedCompletion.id }, relations: ['user', 'quest'] });
        
        return { updatedUser, updatedCompletion: finalCompletion, newUserTrophies, newNotifications };
    });
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

        // Chronicle Logging
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

        const notification = manager.create(SystemNotificationEntity, {
            id: `sysnotif-reject-${completion.id}`,
            type: 'QuestRejected',
            message: `${rejecter.gameName} rejected your completion of "${completion.quest.title}".`,
            recipientUserIds: [completion.user.id],
            readByUserIds: [],
            senderId: rejecterId,
            timestamp: new Date().toISOString(),
            link: 'Chronicles',
            icon: completion.quest.icon,
            iconType: completion.quest.iconType,
            imageUrl: completion.quest.imageUrl,
            guildId: completion.quest.guildId || undefined,
        });
        await manager.save(updateTimestamps(notification, true));

        updateEmitter.emit('update');
        return { updatedCompletion };
    });
};

const revertQuestCompletion = async (completionId, adminId) => {
    return await dataSource.transaction(async manager => {
        const completionRepo = manager.getRepository(QuestCompletionEntity);
        const userRepo = manager.getRepository(UserEntity);
        const questRepo = manager.getRepository(QuestEntity);
        const rewardTypeRepo = manager.getRepository(RewardTypeDefinitionEntity);
        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const notificationRepo = manager.getRepository(SystemNotificationEntity);
        const userTrophyRepo = manager.getRepository(UserTrophyEntity);

        const completion = await completionRepo.findOne({
            where: { id: completionId },
            relations: ['user', 'quest']
        });
        
        if (!completion || completion.status !== 'Approved') {
            console.error(`[Revert Service] Completion not found or not approved. ID: ${completionId}, Status: ${completion?.status}`);
            return null;
        }

        const admin = await userRepo.findOneBy({ id: adminId });
        const user = completion.user;
        const quest = completion.quest;
        if (!admin || !user || !quest) {
            console.error(`[Revert Service] Admin, user, or quest not found for completion ${completionId}`);
            return null;
        }

        const actedAt = new Date().toISOString();
        completion.status = 'Rejected';
        completion.actedById = adminId;
        completion.actedAt = actedAt;
        completion.adminNote = (completion.adminNote ? completion.adminNote + '\n' : '') + `Reverted by ${admin.gameName} on ${new Date().toLocaleDateString()}.`;
        const updatedCompletion = await completionRepo.save(updateTimestamps(completion));

        // Figure out which rewards were granted for this specific completion
        const allRewardsToRevert = [];
        if (quest.type === 'Journey' && completion.checkpointId) {
             const checkpoint = (quest.checkpoints || []).find(cp => cp.id === completion.checkpointId);
             if (checkpoint) {
                 allRewardsToRevert.push(...(checkpoint.rewards || []));
             }
             const approvedCount = await manager.count(QuestCompletionEntity, { where: { quest: { id: quest.id }, user: { id: user.id }, status: 'Approved' } });
             const totalCheckpoints = quest.checkpoints?.length || 0;
             // If the number of approved checkpoints now is one less than the total, it means the one we just reverted was the final one.
             if (totalCheckpoints > 0 && (approvedCount + 1) === totalCheckpoints) {
                 allRewardsToRevert.push(...(quest.rewards || []));
             }
        } else {
            allRewardsToRevert.push(...(quest.rewards || []));
        }

        // Revert rewards
        const rewardTypes = await rewardTypeRepo.find();
        const balances = quest.guildId && user.guildBalances[quest.guildId] ? user.guildBalances[quest.guildId] : { purse: user.personalPurse, experience: user.personalExperience };
        
        allRewardsToRevert.forEach(reward => {
            const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
            if (rewardDef) {
                const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                target[reward.rewardTypeId] = Math.max(0, (target[reward.rewardTypeId] || 0) - reward.amount);
            }
        });

        if (quest.guildId) {
            user.guildBalances[quest.guildId] = balances;
        }
        const userUpdatePayload = quest.guildId ? { guildBalances: user.guildBalances } : { personalPurse: balances.purse, personalExperience: balances.experience };
        const updatedUser = await userRepo.save(updateTimestamps({ ...user, ...userUpdatePayload }));

        // Revert trophy if one was awarded
        if (quest.type === 'Journey' && completion.checkpointId) {
             const checkpoint = (quest.checkpoints || []).find(cp => cp.id === completion.checkpointId);
             if (checkpoint?.trophyId) {
                 await userTrophyRepo.delete({
                     userId: user.id,
                     trophyId: checkpoint.trophyId,
                     guildId: quest.guildId || undefined,
                 });
             }
        }
        
        // Log to chronicles
        const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
        const rewardsText = allRewardsToRevert.map(r => `-${r.amount}${getRewardInfo(r.rewardTypeId).icon}`).join(' ');

        const eventData = {
            id: `chron-revert-${completion.id}`,
            originalId: completion.id,
            date: actedAt,
            type: 'QuestCompletion',
            title: `Reverted "${quest.title}"`,
            status: 'Reverted',
            color: '#f87171',
            userId: user.id,
            userName: user.gameName,
            actorId: adminId,
            actorName: admin.gameName,
            guildId: quest.guildId || undefined,
            rewardsText: rewardsText || undefined,
            icon: quest.icon,
            iconType: quest.iconType,
            imageUrl: quest.imageUrl,
        };
        await manager.save(ChronicleEventEntity, updateTimestamps(chronicleRepo.create(eventData), true));

        // Create notification
        const notification = manager.create(SystemNotificationEntity, {
            id: `sysnotif-revert-${completion.id}`,
            type: 'QuestRejected',
            message: `${admin.gameName} reverted your completion of "${quest.title}". Your rewards have been adjusted.`,
            recipientUserIds: [user.id],
            readByUserIds: [],
            senderId: adminId,
            timestamp: new Date().toISOString(),
            link: 'Chronicles',
            icon: quest.icon,
            iconType: quest.iconType,
            imageUrl: quest.imageUrl,
            guildId: quest.guildId || undefined,
        });
        await manager.save(updateTimestamps(notification, true));

        updateEmitter.emit('update');
        return { updatedUser, updatedCompletion };
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
        if (quest.pendingClaims.some(c => c.userId === userId)) return { ...quest, assignedUserIds: quest.assignedUsers.map(u => u.id) };

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

const updateReadingProgress = async (questId, userId, progressData) => {
    const quest = await questRepo.findOneBy({ id: questId });
    if (!quest) return null;

    if (!quest.readingProgress) {
        quest.readingProgress = {};
    }
    if (!quest.readingProgress[userId] || typeof quest.readingProgress[userId] !== 'object') {
        const oldSeconds = typeof quest.readingProgress[userId] === 'number' ? quest.readingProgress[userId] : 0;
        quest.readingProgress[userId] = { totalSeconds: oldSeconds };
    }

    const userProgress = quest.readingProgress[userId];

    if (progressData.secondsToAdd) {
        userProgress.totalSeconds = (userProgress.totalSeconds || 0) + progressData.secondsToAdd;
    }
    if (typeof progressData.sessionSeconds === 'number') {
        userProgress.sessionSeconds = progressData.sessionSeconds;
    }
    if (progressData.locationCfi) {
        userProgress.locationCfi = progressData.locationCfi;
    }
    if (progressData.bookmarks) {
        userProgress.bookmarks = progressData.bookmarks;
    }
     if (progressData.pageNumber) {
        userProgress.pageNumber = progressData.pageNumber;
    }

    quest.readingProgress[userId] = userProgress;
    quest.readingProgress = { ...quest.readingProgress };

    const saved = await questRepo.save(updateTimestamps(quest));
    updateEmitter.emit('update');
    return { success: true };
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
    approveQuestCompletion,
    rejectQuestCompletion,
    revertQuestCompletion,
    markAsTodo,
    unmarkAsTodo,
    completeCheckpoint,
    claimQuest,
    unclaimQuest,
    approveClaim,
    rejectClaim,
    updateReadingProgress,
};