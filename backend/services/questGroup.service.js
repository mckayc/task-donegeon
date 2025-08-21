const questGroupRepository = require('../repositories/questGroup.repository');
const questRepository = require('../repositories/quest.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const getAll = () => questGroupRepository.findAll();

const create = async (data) => {
    const newGroup = {
        ...data,
        id: `qg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    const saved = await questGroupRepository.create(newGroup);
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, data) => {
    const saved = await questGroupRepository.update(id, data);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids) => {
    await questRepository.unassignGroup(ids);
    await questGroupRepository.deleteMany(ids);
    updateEmitter.emit('update');
};

const assignToUsers = async (groupId, userIds) => {
    await questRepository.assignGroupToUsers(groupId, userIds);
    updateEmitter.emit('update');
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    assignToUsers,
};