const rewardTypeRepository = require('../repositories/rewardType.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { dataSource } = require('../data-source');
const { logAdminAssetAction } = require('../utils/helpers');


const getAll = () => rewardTypeRepository.findAll();

const create = async (data) => {
    return await dataSource.transaction(async manager => {
        const newReward = {
            ...data,
            id: `reward-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            isCore: false,
        };
        const saved = await manager.getRepository('RewardTypeDefinition').save(newReward);
        await logAdminAssetAction(manager, { actorId: data.actorId, actionType: 'create', assetType: 'Reward Type', assetCount: 1, assetName: saved.name });
        updateEmitter.emit('update');
        return saved;
    });
};

const update = async (id, data) => {
    const { isCore, ...updateData } = data; // Prevent changing isCore status
    const saved = await rewardTypeRepository.update(id, updateData);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const clone = async (id) => {
    const rewardToClone = await rewardTypeRepository.findById(id);
    if (!rewardToClone) return null;

    const newRewardData = {
        ...rewardToClone,
        id: `reward-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: `${rewardToClone.name} (Copy)`,
        isCore: false,
    };

    const saved = await rewardTypeRepository.create(newRewardData);
    updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids, actorId) => {
    return await dataSource.transaction(async manager => {
        const rewardsToDelete = await manager.getRepository('RewardTypeDefinition').findBy({ id: In(ids) });
        const nonCoreIds = rewardsToDelete.filter(r => !r.isCore).map(r => r.id);
        if (nonCoreIds.length > 0) {
            await manager.getRepository('RewardTypeDefinition').delete(nonCoreIds);
            await logAdminAssetAction(manager, { actorId, actionType: 'delete', assetType: 'Reward Type', assetCount: nonCoreIds.length });
            updateEmitter.emit('update');
        }
    });
};

module.exports = {
    getAll,
    create,
    update,
    clone,
    deleteMany,
};