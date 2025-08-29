const { dataSource } = require('../data-source');
const { PurchaseRequestEntity, UserEntity, GameAssetEntity, RewardTypeDefinitionEntity, SettingEntity, ChronicleEventEntity } = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');

const create = async (assetId, userId, costGroupIndex, guildId) => {
    return await dataSource.transaction(async manager => {
        const userRepo = manager.getRepository(UserEntity);
        const assetRepo = manager.getRepository(GameAssetEntity);
        const requestRepo = manager.getRepository(PurchaseRequestEntity);
        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const rewardTypeRepo = manager.getRepository(RewardTypeDefinitionEntity);

        const user = await userRepo.findOneBy({ id: userId });
        const asset = await assetRepo.findOneBy({ id: assetId });
        if (!user || !asset) return null;

        const cost = asset.costGroups[costGroupIndex];
        if (!cost) return null;

        const newPurchaseRequestData = {
            userId, assetId, guildId,
            requestedAt: new Date().toISOString(),
            status: asset.requiresApproval ? 'Pending' : 'Completed',
            assetDetails: { name: asset.name, description: asset.description, cost }
        };
        const newRequest = requestRepo.create({ ...newPurchaseRequestData, id: `pr-${Date.now()}`});
        const savedRequest = await requestRepo.save(updateTimestamps(newRequest, true));

        // Deduct funds (escrow)
        const rewardTypes = await rewardTypeRepo.find();
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
            asset.purchaseCount = (asset.purchaseCount || 0) + 1;
            await assetRepo.save(updateTimestamps(asset));
        }

        const userUpdatePayload = guildId ? { guildBalances: user.guildBalances } : { personalPurse: user.personalPurse, personalExperience: user.personalExperience };
        userUpdatePayload.ownedAssetIds = user.ownedAssetIds;
        const updatedUser = await userRepo.save(updateTimestamps(user));
        
        // --- Chronicle Logging ---
        const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
        const rewardsText = cost.map(c => `-${c.amount}${getRewardInfo(c.rewardTypeId).icon}`).join(' ');
        const isPending = savedRequest.status === 'Pending';
        const eventData = {
            id: `chron-${savedRequest.id}`,
            originalId: savedRequest.id,
            date: savedRequest.requestedAt,
            type: 'Purchase',
            title: isPending ? `Requested "${asset.name}"` : `Purchased "${asset.name}"`,
            status: savedRequest.status,
            iconType: asset.iconType,
            icon: asset.icon,
            imageUrl: asset.imageUrl,
            color: isPending ? '#facc15' : '#4ade80',
            userId: user.id,
            userName: user.gameName,
            actorId: user.id,
            actorName: user.gameName,
            guildId: savedRequest.guildId || undefined,
            rewardsText: rewardsText
        };
        const newEvent = chronicleRepo.create(eventData);
        await manager.save(updateTimestamps(newEvent, true));

        updateEmitter.emit('update');
        return { updatedUser, newPurchaseRequest: savedRequest };
    });
};

const approve = async (id, approverId) => {
    return await dataSource.transaction(async manager => {
        const requestRepo = manager.getRepository(PurchaseRequestEntity);
        const userRepo = manager.getRepository(UserEntity);
        const assetRepo = manager.getRepository(GameAssetEntity);
        const settingRepo = manager.getRepository(SettingEntity);
        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        
        const request = await requestRepo.findOneBy({ id });
        if (!request || request.status !== 'Pending') return null;

        const settingRow = await settingRepo.findOneBy({ id: 1 });
        const settings = settingRow?.settings || {};
        const isSelfApproval = request.userId === approverId;

        if (isSelfApproval && !settings.security?.allowAdminSelfApproval) {
            const adminCount = await userRepo.count({ where: { role: 'Donegeon Master' } });
            if (adminCount > 1) {
                throw new Error('Self-approval is disabled. Another administrator must approve this request.');
            }
        }

        const actedAt = new Date().toISOString();
        request.status = 'Completed';
        request.actedAt = actedAt;
        request.actedById = approverId;
        const updatedPurchaseRequest = await requestRepo.save(updateTimestamps(request));

        const user = await userRepo.findOneBy({ id: request.userId });
        const asset = await assetRepo.findOneBy({ id: request.assetId });
        let updatedUser = null;
        if (user && asset) {
            user.ownedAssetIds.push(asset.id);
            asset.purchaseCount = (asset.purchaseCount || 0) + 1;
            await assetRepo.save(updateTimestamps(asset));
            updatedUser = await userRepo.save(updateTimestamps({ ...user, ownedAssetIds: user.ownedAssetIds }));
        }
        
        // --- Chronicle Update ---
        const approver = await userRepo.findOneBy({ id: approverId });
        const chronicleEvent = await chronicleRepo.findOneBy({ originalId: id });
        if (chronicleEvent) {
            chronicleRepo.merge(chronicleEvent, {
                date: actedAt,
                title: `Purchased "${request.assetDetails.name}"`,
                status: 'Completed',
                color: '#4ade80',
                actorId: approverId,
                actorName: approver?.gameName || 'System',
            });
            await chronicleRepo.save(updateTimestamps(chronicleEvent));
        }

        updateEmitter.emit('update');
        return { updatedUser, updatedPurchaseRequest };
    });
};

const rejectOrCancel = async (id, actorId, status) => {
    return await dataSource.transaction(async manager => {
        const requestRepo = manager.getRepository(PurchaseRequestEntity);
        const userRepo = manager.getRepository(UserEntity);
        const rewardTypeRepo = manager.getRepository(RewardTypeDefinitionEntity);
        const chronicleRepo = manager.getRepository(ChronicleEventEntity);

        const request = await requestRepo.findOneBy({ id });
        if (!request || request.status !== 'Pending') return null;

        const actedAt = new Date().toISOString();
        request.status = status;
        request.actedAt = actedAt;
        request.actedById = actorId;
        const updatedPurchaseRequest = await requestRepo.save(updateTimestamps(request));
        
        const user = await userRepo.findOneBy({ id: request.userId });
        let updatedUser = null;
        if (user) {
            const rewardTypes = await rewardTypeRepo.find();
            const balances = request.guildId ? user.guildBalances[request.guildId] || { purse: {}, experience: {} } : { purse: user.personalPurse, experience: user.personalExperience };
            for (const item of request.assetDetails.cost) {
                const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
                if (rewardDef) {
                    const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                    target[item.rewardTypeId] = (target[item.rewardTypeId] || 0) + item.amount;
                }
            }
            const userUpdatePayload = request.guildId ? { guildBalances: user.guildBalances } : { personalPurse: user.personalPurse, personalExperience: user.personalExperience };
            updatedUser = await userRepo.save(updateTimestamps({ ...user, ...userUpdatePayload }));
        }
        
        // --- Chronicle Update ---
        const actor = actorId ? await userRepo.findOneBy({ id: actorId }) : user;
        const chronicleEvent = await chronicleRepo.findOneBy({ originalId: id });
        if (chronicleEvent) {
            chronicleRepo.merge(chronicleEvent, {
                date: actedAt,
                title: `${status} purchase of "${request.assetDetails.name}"`,
                status,
                color: status === 'Rejected' ? '#f87171' : '#a8a29e',
                actorId: actor?.id,
                actorName: actor?.gameName,
            });
            await chronicleRepo.save(updateTimestamps(chronicleEvent));
        }

        updateEmitter.emit('update');
        return { updatedUser, updatedPurchaseRequest };
    });
};

const reject = (id, rejecterId) => rejectOrCancel(id, rejecterId, 'Rejected');
const cancel = (id, cancellerId) => rejectOrCancel(id, cancellerId, 'Cancelled');


module.exports = {
    create,
    approve,
    reject,
    cancel,
};