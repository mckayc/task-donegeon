const rankRepository = require('../repositories/rank.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { dataSource } = require('../data-source');
const { logAdminAssetAction } = require('../utils/helpers');


const getAll = () => rankRepository.findAllSorted();

const create = async (data) => {
    return await dataSource.transaction(async manager => {
        const newRank = {
            ...data,
            id: `rank-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        const saved = await manager.getRepository('Rank').save(newRank);
        await logAdminAssetAction(manager, { actorId: data.actorId, actionType: 'create', assetType: 'Rank', assetCount: 1, assetName: saved.name });
        updateEmitter.emit('update');
        return saved;
    });
};

const update = async (id, data) => {
    const rank = await rankRepository.findById(id);
    if (!rank) return null;
    
    if (rank.xpThreshold === 0 && data.xpThreshold !== 0) {
        throw new Error('The xpThreshold of the first rank cannot be changed from 0.');
    }
    
    const saved = await rankRepository.update(id, data);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids, actorId) => {
    return await dataSource.transaction(async manager => {
        const ranksToDelete = await manager.getRepository('Rank').findBy({ id: In(ids) });
        const nonDeletableRank = ranksToDelete.find(r => r.xpThreshold === 0);
        if (nonDeletableRank) {
            throw new Error('Cannot delete the base rank with 0 XP threshold.');
        }
        await manager.getRepository('Rank').delete(ids);
        await logAdminAssetAction(manager, { actorId, actionType: 'delete', assetType: 'Rank', assetCount: ids.length });
        updateEmitter.emit('update');
    });
};

const replaceAll = async (ranks) => {
    await rankRepository.replaceAll(ranks);
    updateEmitter.emit('update');
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    replaceAll,
};