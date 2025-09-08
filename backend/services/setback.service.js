const setbackRepository = require('../repositories/setback.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { dataSource } = require('../data-source');
const { logAdminAssetAction } = require('../utils/helpers');


const getAll = () => setbackRepository.findAll();

const create = async (data) => {
    return await dataSource.transaction(async manager => {
        const newSetback = {
            ...data,
            id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        const saved = await manager.getRepository('ModifierDefinition').save(newSetback);
        await logAdminAssetAction(manager, { actorId: data.actorId, actionType: 'create', assetType: 'Triumph/Trial', assetCount: 1, assetName: saved.name });
        updateEmitter.emit('update');
        return saved;
    });
};

const update = async (id, data) => {
    const saved = await setbackRepository.update(id, data);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids, actorId) => {
    return await dataSource.transaction(async manager => {
        await manager.getRepository('ModifierDefinition').delete(ids);
        await logAdminAssetAction(manager, { actorId, actionType: 'delete', assetType: 'Triumph/Trial', assetCount: ids.length });
        updateEmitter.emit('update');
    });
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
};