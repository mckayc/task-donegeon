const assetRepository = require('../repositories/asset.repository');
const userRepository = require('../repositories/user.repository');
const rewardTypeRepository = require('../repositories/rewardType.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps, logAdminAssetAction } = require('../utils/helpers');
const { dataSource } = require('../data-source');


const getAll = () => assetRepository.findAll();

const create = async (assetData) => {
    return await dataSource.transaction(async manager => {
        const newAsset = {
            ...assetData,
            id: `gameasset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            creatorId: assetData.actorId || 'system',
            purchaseCount: 0,
            isAvailable: assetData.isAvailable !== false,
        };
        const saved = await manager.getRepository('GameAsset').save(updateTimestamps(newAsset, true));
        await logAdminAssetAction(manager, { actorId: assetData.actorId, actionType: 'create', assetType: 'Game Asset', assetCount: 1, assetName: saved.name, guildId: saved.guildId });
        updateEmitter.emit('update');
        return saved;
    });
};

const update = async (id, assetData) => {
    const saved = await assetRepository.update(id, assetData);
    if (saved) {
        updateEmitter.emit('update');
    }
    return saved;
};

const clone = async (id) => {
    const assetToClone = await assetRepository.findById(id);
    if (!assetToClone) return null;

    const newAssetData = {
        ...assetToClone,
        id: `gameasset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: `${assetToClone.name} (Copy)`,
        purchaseCount: 0,
    };
    const saved = await assetRepository.create(newAssetData);
    updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids, actorId) => {
    return await dataSource.transaction(async manager => {
        await manager.getRepository('GameAsset').delete(ids);
        await logAdminAssetAction(manager, { actorId, actionType: 'delete', assetType: 'Game Asset', assetCount: ids.length });
        updateEmitter.emit('update');
    });
};

const use = async (assetId, userId) => {
    const user = await userRepository.findById(userId);
    const asset = await assetRepository.findById(assetId);
    if (!user || !asset) return null;

    const itemIndex = user.ownedAssetIds.indexOf(assetId);
    if (itemIndex === -1) return null;
    if (!asset.payouts || asset.payouts.length === 0) return null;

    user.ownedAssetIds.splice(itemIndex, 1);
    
    const rewardTypes = await rewardTypeRepository.findAll();
    asset.payouts.forEach(payout => {
        const rewardDef = rewardTypes.find(rt => rt.id === payout.rewardTypeId);
        if (rewardDef) {
            const target = rewardDef.category === 'Currency' ? user.personalPurse : user.personalExperience;
            target[payout.rewardTypeId] = (target[payout.rewardTypeId] || 0) + payout.amount;
        }
    });

    asset.useCount = (asset.useCount || 0) + 1;

    const updatedUser = await userRepository.update(user.id, user);
    const updatedAsset = await assetRepository.update(asset.id, asset);
    updateEmitter.emit('update');
    return { updatedUser, updatedAsset };
};

const craft = async (assetId, userId) => {
    const user = await userRepository.findById(userId);
    const assetToCraft = await assetRepository.findById(assetId);
    if (!user || !assetToCraft || !assetToCraft.recipe) return null;

    const userInventory = user.ownedAssetIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {});
    
    for (const ingredient of assetToCraft.recipe.ingredients) {
        if ((userInventory[ingredient.assetId] || 0) < ingredient.quantity) {
            return null; // Insufficient ingredients
        }
    }

    for (const ingredient of assetToCraft.recipe.ingredients) {
        for(let i=0; i<ingredient.quantity; i++) {
            const indexToRemove = user.ownedAssetIds.indexOf(ingredient.assetId);
            if (indexToRemove > -1) {
                user.ownedAssetIds.splice(indexToRemove, 1);
            }
        }
    }
    
    user.ownedAssetIds.push(assetToCraft.id);
    
    const updatedUser = await userRepository.update(user.id, { ownedAssetIds: user.ownedAssetIds });
    updateEmitter.emit('update');
    return { updatedUser };
};

const bulkUpdateAvailability = async (ids, isAvailable) => {
    const result = await dataSource.getRepository('GameAsset').update(ids, { isAvailable });
    if (result.affected && result.affected > 0) {
        updateEmitter.emit('update');
    }
    return result;
};


module.exports = {
    getAll,
    create,
    update,
    clone,
    deleteMany,
    use,
    craft,
    bulkUpdateAvailability,
};