const { dataSource } = require('../data-source');
const { PurchaseRequestEntity, UserEntity, GameAssetEntity, RewardTypeDefinitionEntity, SettingEntity, ChronicleEventEntity, MarketEntity } = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');

const create = async (assetId, userId, costGroupIndex, guildId, marketId) => {
    return await dataSource.transaction(async manager => {
        const userRepo = manager.getRepository(UserEntity);
        const assetRepo = manager.getRepository(GameAssetEntity);
        const requestRepo = manager.getRepository(PurchaseRequestEntity);
        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const rewardTypeRepo = manager.getRepository(RewardTypeDefinitionEntity);
        const marketRepo = manager.getRepository(MarketEntity);

        const user = await userRepo.findOneBy({ id: userId });
        const asset = await assetRepo.findOneBy({ id: assetId });
        const market = await marketRepo.findOneBy({ id: marketId });
        if (!user || !asset || !market) return null;

        const cost = asset.costGroups[costGroupIndex];
        if (!cost) return null;

        const newPurchaseRequestData = {
            userId, assetId, guildId, marketId,
            requestedAt: new Date().toISOString(),
            status: asset.requiresApproval ? 'Pending' : 'Completed',
            assetDetails: { name: asset.name, description: asset.description, cost, icon: asset.icon, iconType: asset.iconType, imageUrl: asset.imageUrl }
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
            color: isPending ? '#facc15' : '#4ade80',
            userId: user.id,
            userName: user.gameName,
            actorId: user.id,
            actorName: user.gameName,
            guildId: savedRequest.guildId || undefined,
            rewardsText: rewardsText
        };
        
        if (asset.imageUrl && asset.iconType === 'image') {
            eventData.iconType = 'image';
            eventData.imageUrl = asset.imageUrl;
            eventData.icon = '🖼️'; // Fallback emoji
        } else {
            eventData.iconType = 'emoji';
            eventData.imageUrl = null;
            eventData.icon = market.icon;
        }

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
        const marketRepo = manager.getRepository(MarketEntity);
        
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
        
        // --- New Chronicle Event for Approval ---
        const approver = await userRepo.findOneBy({ id: approverId });
        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const rewardTypes = await manager.getRepository(RewardTypeDefinitionEntity).find();
        const market = request.marketId ? await marketRepo.findOneBy({ id: request.marketId }) : null;
        const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
        const rewardsText = request.assetDetails.cost.map(c => `-${c.amount}${getRewardInfo(c.rewardTypeId).icon}`).join(' ');

        const eventData = {
            id: `chron-approve-${request.id}`,
            originalId: request.id,
            date: actedAt,
            type: 'Purchase',
            title: `Purchased "${request.assetDetails.name}"`,
            status: 'Completed',
            color: '#4ade80',
            userId: request.userId,
            userName: user.gameName,
            actorId: approverId,
            actorName: approver?.gameName || 'System',
            guildId: request.guildId || undefined,
            rewardsText,
        };

        if (request.assetDetails.imageUrl && request.assetDetails.iconType === 'image') {
            eventData.iconType = 'image';
            eventData.imageUrl = request.assetDetails.imageUrl;
            eventData.icon = '🖼️'; // Fallback emoji
        } else {
            eventData.iconType = 'emoji';
            eventData.imageUrl = null;
            eventData.icon = market ? market.icon : '🛒';
        }

        const newEvent = chronicleRepo.create(eventData);
        await manager.save(updateTimestamps(newEvent, true));

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
        const marketRepo = manager.getRepository(MarketEntity);

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
        
        // --- New Chronicle Event for Rejection/Cancellation ---
        const actor = actorId ? await userRepo.findOneBy({ id: actorId }) : user;
        const rewardTypes = await manager.getRepository(RewardTypeDefinitionEntity).find();
        const market = request.marketId ? await marketRepo.findOneBy({ id: request.marketId }) : null;
        const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
        const rewardsText = request.assetDetails.cost.map(c => `+${c.amount}${getRewardInfo(c.rewardTypeId).icon}`).join(' '); // Refunding

        const eventData = {
            id: `chron-${status.toLowerCase()}-${request.id}`,
            originalId: request.id,
            date: actedAt,
            type: 'Purchase',
            title: `${status} purchase of "${request.assetDetails.name}"`,
            status: status,
            color: status === 'Rejected' ? '#f87171' : '#a8a29e',
            userId: request.userId,
            userName: user.gameName,
            actorId: actor?.id,
            actorName: actor?.gameName,
            guildId: request.guildId || undefined,
            rewardsText,
        };

        if (request.assetDetails.imageUrl && request.assetDetails.iconType === 'image') {
            eventData.iconType = 'image';
            eventData.imageUrl = request.assetDetails.imageUrl;
            eventData.icon = '🖼️'; // Fallback emoji
        } else {
            eventData.iconType = 'emoji';
            eventData.imageUrl = null;
            eventData.icon = market ? market.icon : '🛒';
        }
        
        const newEvent = chronicleRepo.create(eventData);
        await manager.save(updateTimestamps(newEvent, true));

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