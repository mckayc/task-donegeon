const rotationRepository = require('../repositories/rotation.repository');
const questRepository = require('../repositories/quest.repository');
const userRepository = require('../repositories/user.repository');
const notificationRepository = require('../repositories/notification.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const getAll = () => rotationRepository.findAll();

const create = async (data) => {
    const newRotation = {
        ...data,
        id: `rotation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    const saved = await rotationRepository.create(newRotation);
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, data) => {
    const saved = await rotationRepository.update(id, data);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids) => {
    await rotationRepository.deleteMany(ids);
    updateEmitter.emit('update');
};

const run = async (id) => {
    const rotation = await rotationRepository.findById(id);
    if (!rotation || rotation.questIds.length === 0 || rotation.userIds.length === 0) {
        return { success: false, message: 'Rotation is not configured with quests and users.' };
    }

    const nextUserIndex = (rotation.lastUserIndex + 1) % rotation.userIds.length;
    const nextQuestIndex = (rotation.lastQuestIndex + 1) % rotation.questIds.length;
    
    const userIdToAssign = rotation.userIds[nextUserIndex];
    const questIdToAssign = rotation.questIds[nextQuestIndex];
    
    const questToAssign = await questRepository.findByIdWithRelations(questIdToAssign);
    const userToAssign = await userRepository.findById(userIdToAssign);

    if (!questToAssign || !userToAssign) {
        return { success: false, message: 'Quest or User not found in rotation.' };
    }

    questToAssign.assignedUsers = [userToAssign];
    await questRepository.save(questToAssign);

    const notificationData = {
        type: 'QuestAssigned',
        message: `You have been assigned a new quest: "${questToAssign.title}"`,
        recipientUserIds: [userIdToAssign],
        link: 'Quests',
        guildId: questToAssign.guildId
    };
    await notificationRepository.create(notificationData);

    rotation.lastUserIndex = nextUserIndex;
    rotation.lastQuestIndex = nextQuestIndex;
    rotation.lastAssignmentDate = new Date().toISOString().split('T')[0];
    await rotationRepository.update(id, rotation);
    
    updateEmitter.emit('update');
    return { success: true, message: `Assigned "${questToAssign.title}" to ${userToAssign.gameName}.` };
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    run,
};