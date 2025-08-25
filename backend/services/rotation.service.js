
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
        
        // Ensure consistent ordering by sorting by a stable property like name/title.
        const quests = await questRepo.find({ where: { id: In(rotation.questIds) }, relations: ['assignedUsers'], order: { title: 'ASC' } });
        const users = await userRepo.find({ where: { id: In(rotation.userIds) }, order: { gameName: 'ASC' } });

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
        
        const assignments = [];
        const usersWithNewQuests = new Map();
        let nextUserIdx = (rotation.lastUserIndex + 1);
        let nextQuestIdx = (rotation.lastQuestStartIndex + 1);
        
        // 2. Loop through users and determine the assignment plan for THIS run.
        for (let i = 0; i < numUsers; i++) {
            if (assignments.length >= numQuests) break; // Stop if all quests are planned.

            const currentUserIndex = nextUserIdx % numUsers;
            const userToAssign = users[currentUserIndex];
            const assignedQuestsForThisUser = [];

            for (let j = 0; j < questsPerUser; j++) {
                if (assignments.length >= numQuests) break;

                const currentQuestIndex = nextQuestIdx % numQuests;
                const questToAssign = quests[currentQuestIndex];
                
                assignments.push({ user: userToAssign, quest: questToAssign });
                assignedQuestsForThisUser.push(questToAssign);

                nextQuestIdx++;
            }
            
            if (assignedQuestsForThisUser.length > 0) {
                usersWithNewQuests.set(userToAssign.id, assignedQuestsForThisUser);
            }
            
            nextUserIdx++;
        }
        
        // 3. Apply the assignments and save changes
        if (assignments.length > 0) {
            for (const { user, quest } of assignments) {
                quest.assignedUsers.push(user);
            }

            // 4. Update the rotation state to the LAST assignment made
            const lastAssignment = assignments[assignments.length - 1];
            const lastUserAssigned = lastAssignment.user;
            const lastQuestAssigned = lastAssignment.quest;
            
            rotation.lastUserIndex = users.findIndex(u => u.id === lastUserAssigned.id);
            rotation.lastQuestStartIndex = quests.findIndex(q => q.id === lastQuestAssigned.id);
            rotation.lastAssignmentDate = new Date().toISOString().split('T')[0];
            
            // 5. Create notifications
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

            // 6. Save all database changes
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


module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    clone,
    run,
};