

const { dataSource } = require('../data-source');
const { RotationEntity, QuestEntity, UserEntity, SystemNotificationEntity } = require('../entities');
const { In } = require("typeorm");
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps, logAdminAssetAction } = require('../utils/helpers');

const getAll = async () => {
    const repo = dataSource.getRepository(RotationEntity);
    return repo.find();
};

const create = async (data) => {
    return await dataSource.transaction(async manager => {
        const repo = manager.getRepository(RotationEntity);
        const newRotation = repo.create({
            ...data,
            id: `rotation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        });
        const saved = await repo.save(updateTimestamps(newRotation, true));
        await logAdminAssetAction(manager, { actorId: data.actorId, actionType: 'create', assetType: 'Rotation', assetCount: 1, assetName: saved.name });
        updateEmitter.emit('update');
        return saved;
    });
};

const update = async (id, data) => {
    const repo = dataSource.getRepository(RotationEntity);
    const rotation = await repo.findOneBy({ id });
    if (!rotation) return null;
    repo.merge(rotation, data);
    const saved = await repo.save(updateTimestamps(rotation));
    if (saved) updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids, actorId) => {
    return await dataSource.transaction(async manager => {
        const repo = manager.getRepository(RotationEntity);
        await repo.delete(ids);
        await logAdminAssetAction(manager, { actorId, actionType: 'delete', assetType: 'Rotation', assetCount: ids.length });
        updateEmitter.emit('update');
    });
};

const clone = async (id) => {
    const repo = dataSource.getRepository(RotationEntity);
    const rotationToClone = await repo.findOneBy({ id });
    if (!rotationToClone) return null;

    const { id: oldId, createdAt, updatedAt, ...cloneableData } = rotationToClone;

    const newRotationData = {
        ...cloneableData,
        name: `${rotationToClone.name} (Copy)`,
        lastAssignmentDate: null,
        lastUserIndex: -1,
        lastQuestStartIndex: -1,
    };
    
    return create(newRotationData);
};

const run = async (id) => {
    return await dataSource.transaction(async manager => {
        const rotationRepo = manager.getRepository(RotationEntity);
        const questRepo = manager.getRepository(QuestEntity);
        const userRepo = manager.getRepository(UserEntity);
        const notificationRepo = manager.getRepository(SystemNotificationEntity);

        const rotation = await rotationRepo.findOneBy({ id });
        if (!rotation) {
            return { message: "Rotation not found." };
        }
        
        const quests = await questRepo.find({ where: { id: In(rotation.questIds) }, relations: ['assignedUsers'], order: { title: 'ASC' } });
        const users = await userRepo.find({ where: { id: In(rotation.userIds) }, order: { gameName: 'ASC' } });

        if (quests.length === 0 || users.length === 0) {
            return { message: "No quests or users available for this rotation." };
        }

        const { questsPerUser } = rotation;
        const numUsers = users.length;
        const numQuests = quests.length;

        const userIdsInRotationSet = new Set(users.map(u => u.id));
        for (const quest of quests) {
            quest.assignedUsers = quest.assignedUsers.filter(user => !userIdsInRotationSet.has(user.id));
        }
        
        const assignments = [];
        const usersWithNewQuests = new Map();
        let nextUserIdx = (rotation.lastUserIndex + 1);
        let nextQuestIdx = (rotation.lastQuestStartIndex + 1);
        
        const maxAssignmentsForThisRun = Math.min(numUsers * questsPerUser, numQuests);
        let assignmentsMade = 0;

        while (assignmentsMade < maxAssignmentsForThisRun) {
            const userToAssign = users[nextUserIdx % numUsers];
            const questToAssign = quests[nextQuestIdx % numQuests];

            assignments.push({ user: userToAssign, quest: questToAssign });
            
            if (!usersWithNewQuests.has(userToAssign.id)) {
                usersWithNewQuests.set(userToAssign.id, []);
            }
            usersWithNewQuests.get(userToAssign.id).push(questToAssign);
            
            assignmentsMade++;
            nextUserIdx++;
            nextQuestIdx++;
        }
        
        if (assignments.length > 0) {
            for (const { user, quest } of assignments) {
                if (!quest.assignedUsers.some(u => u.id === user.id)) {
                    quest.assignedUsers.push(user);
                }
            }

            const lastAssignment = assignments[assignments.length - 1];
            rotation.lastUserIndex = users.findIndex(u => u.id === lastAssignment.user.id);
            rotation.lastQuestStartIndex = quests.findIndex(q => q.id === lastAssignment.quest.id);
            rotation.lastAssignmentDate = new Date().toISOString().split('T')[0];
            
            const notificationsToCreate = [];
            for (const [userId, assignedQuests] of usersWithNewQuests.entries()) {
                const newNotification = notificationRepo.create({
                    id: `sysnotif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    type: 'QuestAssigned',
                    message: `You have been assigned ${assignedQuests.length} new quest(s) from the "${rotation.name}" rotation.`,
                    recipientUserIds: [userId],
                    readByUserIds: [],
                    timestamp: new Date().toISOString(),
                    link: 'Quests',
                });
                notificationsToCreate.push(newNotification);
            }

            await manager.save(QuestEntity, quests.map(q => updateTimestamps(q)));
            await manager.save(RotationEntity, updateTimestamps(rotation));
            if (notificationsToCreate.length > 0) {
                await manager.save(SystemNotificationEntity, notificationsToCreate.map(n => updateTimestamps(n, true)));
            }

            updateEmitter.emit('update');
            return { message: `Rotation "${rotation.name}" ran successfully. Assigned ${assignments.length} quests.` };
        }

        return { message: `Rotation "${rotation.name}" ran, but no quests were assigned.` };
    });
};

const runAllScheduled = async () => {
    console.log('[Rotation Service] Running scheduled rotation check...');
    const rotationRepo = dataSource.getRepository(RotationEntity);
    const allRotations = await rotationRepo.find({ where: { isActive: true } });

    const today = new Date();
    const todayYMD = today.toISOString().split('T')[0];
    const todayDayOfWeek = today.getDay();

    for (const rotation of allRotations) {
        if (rotation.lastAssignmentDate === todayYMD) continue;
        if (rotation.startDate && todayYMD < rotation.startDate) continue;
        if (rotation.endDate && todayYMD > rotation.endDate) continue;
        if (!rotation.activeDays.includes(todayDayOfWeek)) continue;
        
        if (rotation.frequency === 'WEEKLY') {
            const firstActiveDayOfWeek = Math.min(...rotation.activeDays);
            if (todayDayOfWeek !== firstActiveDayOfWeek) {
                continue;
            }
        }
        
        console.log(`[Rotation Service] Triggering scheduled rotation "${rotation.name}" (ID: ${rotation.id})`);
        try {
            await run(rotation.id);
        } catch (error) {
            console.error(`[Rotation Service] Error running scheduled rotation ${rotation.id}:`, error);
        }
    }
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    clone,
    run,
    runAllScheduled,
};