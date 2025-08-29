const questGroupRepository = require('../repositories/questGroup.repository');
const questRepository = require('../repositories/quest.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { dataSource } = require('../data-source');
const { logAdminAssetAction } = require('../utils/helpers');


const getAll = () => questGroupRepository.findAll();

const create = async (data) => {
    return await dataSource.transaction(async manager => {
        const newGroup = {
            ...data,
            id: `qg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        const saved = await manager.getRepository('QuestGroup').save(newGroup);
        await logAdminAssetAction(manager, { actorId: data.actorId, actionType: 'create', assetType: 'Quest Group', assetCount: 1, assetName: saved.name });
        updateEmitter.emit('update');
        return saved;
    });
};

const update = async (id, data) => {
    const saved = await questGroupRepository.update(id, data);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids, actorId) => {
    return await dataSource.transaction(async manager => {
        await manager.getRepository('Quest').update({ groupId: In(ids) }, { groupId: null });
        await manager.getRepository('QuestGroup').delete(ids);
        await logAdminAssetAction(manager, { actorId, actionType: 'delete', assetType: 'Quest Group', assetCount: ids.length });
        updateEmitter.emit('update');
    });
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