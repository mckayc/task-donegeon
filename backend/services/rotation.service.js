
const { dataSource } = require('../data-source');
const { RotationEntity, QuestEntity, UserEntity, SystemNotificationEntity } = require('../entities');
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
        if (!rotation || rotation.questIds.length === 0 || rotation.userIds.length === 0) {
            return { success: false, message: 'Rotation is not configured with quests and users.' };
        }

        const nextUserIndex = (rotation.lastUserIndex + 1) % rotation.userIds.length;
        const nextQuestIndex = (rotation.lastQuestIndex + 1) % rotation.questIds.length;
        
        const userIdToAssign = rotation.userIds[nextUserIndex];
        const questIdToAssign = rotation.questIds[nextQuestIndex];
        
        const questToAssign = await questRepo.findOne({ where: { id: questIdToAssign }, relations: ['assignedUsers'] });
        const userToAssign = await userRepo.findOneBy({ id: userIdToAssign });

        if (!questToAssign || !userToAssign) {
            return { success: false, message: 'Quest or User not found in rotation.' };
        }

        questToAssign.assignedUsers = [userToAssign];
        await questRepo.save(updateTimestamps(questToAssign));

        const newNotification = notificationRepo.create({
            id: `sysnotif-${Date.now()}-${Math.random()}`,
            type: 'QuestAssigned',
            message: `You have been assigned a new quest: "${questToAssign.title}"`,
            recipientUserIds: [userIdToAssign],
            readByUserIds: [],
            timestamp: new Date().toISOString(),
            link: 'Quests',
            guildId: questToAssign.guildId,
            icon: questToAssign.icon,
            iconType: questToAssign.iconType,
            imageUrl: questToAssign.imageUrl,
        });
        await notificationRepo.save(updateTimestamps(newNotification, true));

        rotation.lastUserIndex = nextUserIndex;
        rotation.lastQuestIndex = nextQuestIndex;
        rotation.lastAssignmentDate = new Date().toISOString().split('T')[0];
        await rotationRepo.save(updateTimestamps(rotation));
        
        updateEmitter.emit('update');
        return { success: true, message: `Assigned "${questToAssign.title}" to ${userToAssign.gameName}.` };
    });
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    run,
};
