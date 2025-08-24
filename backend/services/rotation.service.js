

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

        const quests = await questRepo.find({ where: { id: In(rotation.questIds) } });
        const users = await userRepo.find({ where: { id: In(rotation.userIds) } });

        if (quests.length === 0 || users.length === 0) {
            return { message: "No quests or users in rotation." };
        }

        const { questsPerUser, lastUserIndex, lastQuestStartIndex } = rotation;
        const numUsers = users.length;
        const numQuests = quests.length;
        
        let questsToUpdate = [];
        let notifications = [];
        let assignedQuestCount = 0;
        
        let currentUserIndex = (lastUserIndex + 1) % numUsers;
        let currentQuestIndex = (lastQuestStartIndex + 1) % numQuests;

        let finalUserIndex = lastUserIndex;
        let finalQuestIndex = lastQuestStartIndex;

        const usersInThisRun = Math.min(numUsers, Math.ceil(numQuests / questsPerUser));

        for (let i = 0; i < usersInThisRun; i++) {
            const user = users[currentUserIndex];
            const userQuests = [];

            for (let j = 0; j < questsPerUser; j++) {
                if (assignedQuestCount >= numQuests) break;

                const quest = quests[currentQuestIndex];
                quest.assignedUserIds = [user.id];
                questsToUpdate.push(quest);
                userQuests.push(quest);

                finalQuestIndex = currentQuestIndex;
                currentQuestIndex = (currentQuestIndex + 1) % numQuests;
                assignedQuestCount++;
            }
            
            finalUserIndex = currentUserIndex;
            currentUserIndex = (currentUserIndex + 1) % numUsers;

            if (userQuests.length > 0) {
                 const newNotification = notificationRepo.create({
                    id: `sysnotif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    type: 'QuestAssigned',
                    message: `You have been assigned ${userQuests.length} new quest(s) from the "${rotation.name}" rotation.`,
                    recipientUserIds: [user.id],
                    readByUserIds: [],
                    timestamp: new Date().toISOString(),
                    link: 'Quests',
                });
                notifications.push(newNotification);
            }
        }

        if (questsToUpdate.length > 0) {
            await manager.save(QuestEntity, questsToUpdate.map(q => updateTimestamps(q)));
            
            rotation.lastUserIndex = finalUserIndex;
            rotation.lastQuestStartIndex = finalQuestIndex;
            rotation.lastAssignmentDate = new Date().toISOString().split('T')[0];

            await manager.save(RotationEntity, updateTimestamps(rotation));
            if(notifications.length > 0) {
                await manager.save(SystemNotificationEntity, notifications.map(n => updateTimestamps(n, true)));
            }

            updateEmitter.emit('update');
            return { message: `Rotation "${rotation.name}" ran successfully. Assigned ${assignedQuestCount} quests.` };
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