

const { dataSource } = require('../data-source');
const { RotationEntity, QuestEntity, UserEntity, SystemNotificationEntity } = require('../entities');
const { In } = require("typeorm");
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');

const getAll = async () => {
    const repo = dataSource.getRepository(RotationEntity);
    return repo.find();
};

const create = async (data) => {
    const repo = dataSource.getRepository(RotationEntity);
    const newRotation = repo.create({
        ...data,
        id: `rotation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    });
    const saved = await repo.save(updateTimestamps(newRotation, true));
    updateEmitter.emit('update');
    return saved;
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

const deleteMany = async (ids) => {
    const repo = dataSource.getRepository(RotationEntity);
    await repo.delete(ids);
    updateEmitter.emit('update');
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
        if (!rotation || !rotation.isActive) {
            return { message: "Rotation not found or is inactive." };
        }
        
        const quests = await questRepo.find({ where: { id: In(rotation.questIds) }, relations: ['assignedUsers'] });
        const users = await userRepo.find({ where: { id: In(rotation.userIds) } });

        if (quests.length === 0 || users.length === 0) {
            return { message: "No quests or users available for this rotation." };
        }

        const { questsPerUser } = rotation;
        const numUsers = users.length;
        const numQuests = quests.length;

        // 1. Clear any existing assignments for these quests FROM users in this rotation.
        const userIdsInRotationSet = new Set(users.map(u => u.id));
        for (const quest of quests) {
            quest.assignedUsers = quest.assignedUsers.filter(user => !userIdsInRotationSet.has(user.id));
        }

        // 2. Determine the starting points for this run.
        const startUserIndex = (rotation.lastUserIndex + 1) % numUsers;
        const startQuestIndex = (rotation.lastQuestStartIndex + 1) % numQuests;
        
        let questsAssignedThisRun = 0;
        const notificationsToCreate = [];
        const usersWithNewQuests = new Map();

        // 3. Loop through users and assign quests sequentially.
        for (let i = 0; i < numUsers; i++) {
            if (questsAssignedThisRun >= numQuests) break; // Stop if all quests have been assigned.

            const currentUserIndex = (startUserIndex + i) % numUsers;
            const user = users[currentUserIndex];

            for (let j = 0; j < questsPerUser; j++) {
                if (questsAssignedThisRun >= numQuests) break;

                const currentQuestIndex = (startQuestIndex + questsAssignedThisRun) % numQuests;
                const quest = quests[currentQuestIndex];

                quest.assignedUsers.push(user);
                
                // Track for notifications
                const userQuestList = usersWithNewQuests.get(user.id) || [];
                userQuestList.push(quest);
                usersWithNewQuests.set(user.id, userQuestList);
                
                questsAssignedThisRun++;
                
                // Update the state for the next run
                rotation.lastUserIndex = currentUserIndex;
                rotation.lastQuestStartIndex = currentQuestIndex;
            }
        }
        
        // 4. Create notifications for users who received quests.
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

        // 5. Save all changes if any assignments were made.
        if (questsAssignedThisRun > 0) {
            await manager.save(QuestEntity, quests.map(q => updateTimestamps(q)));
            
            rotation.lastAssignmentDate = new Date().toISOString().split('T')[0];
            await manager.save(RotationEntity, updateTimestamps(rotation));
            
            if(notificationsToCreate.length > 0) {
                await manager.save(SystemNotificationEntity, notificationsToCreate.map(n => updateTimestamps(n, true)));
            }

            updateEmitter.emit('update');
            return { message: `Rotation "${rotation.name}" ran successfully. Assigned ${questsAssignedThisRun} quests.` };
        }

        return { message: `Rotation "${rotation.name}" ran, but no quests were assigned.` };
    });
};


module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    clone,
    run,
};