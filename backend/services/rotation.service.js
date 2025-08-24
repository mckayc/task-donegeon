

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

const run = async (id) => {
    return await dataSource.transaction(async manager => {
        const rotationRepo = manager.getRepository(RotationEntity);
        const questRepo = manager.getRepository(QuestEntity);
        const userRepo = manager.getRepository(UserEntity);
        const notificationRepo = manager.getRepository(SystemNotificationEntity);

        const rotation = await rotationRepo.findOneBy({ id });
        if (!rotation || !rotation.isActive || rotation.questIds.length === 0 || rotation.userIds.length === 0) {
            return { success: false, message: 'Rotation is inactive or not configured with quests and users.' };
        }

        const quests = await questRepo.findBy({ id: In(rotation.questIds) });
        const users = await userRepo.findBy({ id: In(rotation.userIds) });

        if (quests.length === 0 || users.length === 0) {
            return { success: false, message: 'Could not find quests or users for this rotation.' };
        }
        
        const { questsPerUser, lastUserIndex, lastQuestStartIndex } = rotation;
        const numUsers = users.length;
        const numQuests = quests.length;

        const questsToAssignTotal = Math.min(numUsers * questsPerUser, numQuests);
        
        const startUserIndex = (lastUserIndex + 1) % numUsers;
        const startQuestIndex = (lastQuestStartIndex + 1) % numQuests;
        
        const questsToUpdate = [];
        const notificationsToCreate = [];

        for (let i = 0; i < questsToAssignTotal; i++) {
            const currentUserIndex = (startUserIndex + i) % numUsers;
            const currentQuestIndex = (startQuestIndex + i) % numQuests;
            
            const userToAssign = users[currentUserIndex];
            const questToAssign = await questRepo.findOne({ where: { id: quests[currentQuestIndex].id }, relations: ['assignedUsers'] });

            if (questToAssign && userToAssign) {
                questToAssign.assignedUsers = [userToAssign];
                questsToUpdate.push(updateTimestamps(questToAssign));

                const newNotification = notificationRepo.create({
                    id: `sysnotif-${Date.now()}-${Math.random()}`,
                    type: 'QuestAssigned',
                    message: `You have been assigned a new quest: "${questToAssign.title}"`,
                    recipientUserIds: [userToAssign.id],
                    readByUserIds: [],
                    timestamp: new Date().toISOString(),
                    link: 'Quests',
                    guildId: questToAssign.guildId,
                    icon: questToAssign.icon,
                    iconType: questToAssign.iconType,
                    imageUrl: questToAssign.imageUrl,
                });
                notificationsToCreate.push(updateTimestamps(newNotification, true));
            }
        }
        
        if (questsToUpdate.length > 0) {
            const numAssigned = questsToUpdate.length;
            rotation.lastUserIndex = (startUserIndex + numAssigned - 1) % numUsers;
            rotation.lastQuestStartIndex = (startQuestIndex + numAssigned - 1) % numQuests;
            
            await questRepo.save(questsToUpdate);
            await notificationRepo.save(notificationsToCreate);
        }

        rotation.lastAssignmentDate = new Date().toISOString().split('T')[0];
        await rotationRepo.save(updateTimestamps(rotation));
        
        updateEmitter.emit('update');
        const message = questsToUpdate.length > 0
            ? `Rotation "${rotation.name}" assigned ${questsToUpdate.length} quests.`
            : `Rotation "${rotation.name}" ran, but no quests were assigned.`;
        return { success: true, message };
    });
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    run,
};