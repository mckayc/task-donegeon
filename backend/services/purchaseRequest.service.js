const purchaseRequestRepository = require('../repositories/purchaseRequest.repository');
const userRepository = require('../repositories/user.repository');
const assetRepository = require('../repositories/asset.repository');
const rewardTypeRepository = require('../repositories/rewardType.repository');
const settingRepository = require('../repositories/setting.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const create = async (assetId, userId, costGroupIndex, guildId) => {
    const user = await userRepository.findById(userId);
    const asset = await assetRepository.findById(assetId);
    if (!user || !asset) return null;

    const cost = asset.costGroups[costGroupIndex];
    if (!cost) return null;

    const newPurchaseRequestData = {
        userId, assetId, guildId,
        requestedAt: new Date().toISOString(),
        status: asset.requiresApproval ? 'Pending' : 'Completed',
        assetDetails: { name: asset.name, description: asset.description, cost }
    };
    const savedRequest = await purchaseRequestRepository.create(newPurchaseRequestData);

    // Deduct funds (escrow)
    const rewardTypes = await rewardTypeRepository.findAll();
    const balances = guildId ? user.guildBalances[guildId] || { purse: {}, experience: {} } : { purse: user.personalPurse, experience: user.personalExperience };
    
    for (const item of cost) {
        const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
        if (rewardDef) {
            const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
            target[item.rewardTypeId] = (target[item.rewardTypeId] || 0) - item.amount;
        }
    }
    
    if (!asset.requiresApproval) {
        user.ownedAssetIds.push(asset.id);
        asset.purchaseCount += 1;
        await assetRepository.update(asset.id, { purchaseCount: asset.purchaseCount });
    }

    const userUpdatePayload = guildId ? { guildBalances: user.guildBalances } : { personalPurse: user.personalPurse, personalExperience: user.personalExperience };
    userUpdatePayload.ownedAssetIds = user.ownedAssetIds;
    const updatedUser = await userRepository.update(user.id, userUpdatePayload);

    updateEmitter.emit('update');
    return { updatedUser, newPurchaseRequest: savedRequest };
};

const approve = async (id, approverId) => {
    const request = await purchaseRequestRepository.findById(id);
    if (!request || request.status !== 'Pending') return null;

    const settings = await settingRepository.get();
    const isSelfApproval = request.userId === approverId;

    if (isSelfApproval && !settings.security.allowAdminSelfApproval) {
        const adminCount = await userRepository.countAdmins();
        if (adminCount > 1) {
            throw new Error('Self-approval is disabled. Another administrator must approve this request.');
        }
    }

    const updateData = {
        status: 'Completed',
        actedAt: new Date().toISOString(),
        actedById: approverId
    };
    const updatedPurchaseRequest = await purchaseRequestRepository.update(id, updateData);

    const user = await userRepository.findById(request.userId);
    const asset = await assetRepository.findById(request.assetId);
    let updatedUser = null;
    if (user && asset) {
        user.ownedAssetIds.push(asset.id);
        asset.purchaseCount += 1;
        await assetRepository.update(asset.id, { purchaseCount: asset.purchaseCount });
        updatedUser = await userRepository.update(user.id, { ownedAssetIds: user.ownedAssetIds });
    }

    updateEmitter.emit('update');
    return { updatedUser, updatedPurchaseRequest };
};

const rejectOrCancel = async (id, actorId, status) => {
    const request = await purchaseRequestRepository.findById(id);
    if (!request || request.status !== 'Pending') return null;

    const updateData = {
        status,
        actedAt: new Date().toISOString(),
        actedById: actorId
    };
    const updatedPurchaseRequest = await purchaseRequestRepository.update(id, updateData);
    
    const user = await userRepository.findById(request.userId);
    let updatedUser = null;
    if (user) {
        const rewardTypes = await rewardTypeRepository.findAll();
        const balances = request.guildId ? user.guildBalances[request.guildId] || { purse: {}, experience: {} } : { purse: user.personalPurse, experience: user.personalExperience };
        for (const item of request.assetDetails.cost) {
            const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
            if (rewardDef) {
                const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                target[item.rewardTypeId] = (target[item.rewardTypeId] || 0) + item.amount;
            }
        }
        const userUpdatePayload = request.guildId ? { guildBalances: user.guildBalances } : { personalPurse: user.personalPurse, personalExperience: user.personalExperience };
        updatedUser = await userRepository.update(user.id, userUpdatePayload);
    }

    updateEmitter.emit('update');
    return { updatedUser, updatedPurchaseRequest };
};

const reject = (id, rejecterId) => rejectOrCancel(id, rejecterId, 'Rejected');
const cancel = (id) => rejectOrCancel(id, null, 'Cancelled');


module.exports = {
    create,
    approve,
    reject,
    cancel,
};