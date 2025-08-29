const marketRepository = require('../repositories/market.repository');
const userRepository = require('../repositories/user.repository');
const rewardTypeRepository = require('../repositories/rewardType.repository');
const settingRepository = require('../repositories/setting.repository');
const adminAdjustmentRepository = require('../repositories/adminAdjustment.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { dataSource } = require('../data-source');
const { ChronicleEventEntity } = require('../entities');
const { updateTimestamps, logAdminAssetAction } = require('../utils/helpers');


const getAll = () => marketRepository.findAll();

const create = async (marketData) => {
    return await dataSource.transaction(async manager => {
        const newMarket = {
            ...marketData,
            id: `market-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        const saved = await manager.getRepository('Market').save(updateTimestamps(newMarket, true));
        await logAdminAssetAction(manager, { actorId: marketData.actorId, actionType: 'create', assetType: 'Market', assetCount: 1, assetName: saved.title, guildId: saved.guildId });
        updateEmitter.emit('update');
        return saved;
    });
};

const update = async (id, marketData) => {
    const saved = await marketRepository.update(id, marketData);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids, actorId) => {
    return await dataSource.transaction(async manager => {
        const filteredIds = ids.filter(id => id !== 'market-bank');
        if (filteredIds.length > 0) {
            await manager.getRepository('Market').delete(filteredIds);
            await logAdminAssetAction(manager, { actorId, actionType: 'delete', assetType: 'Market', assetCount: filteredIds.length });
            updateEmitter.emit('update');
        }
    });
};

const clone = async (id) => {
    const marketToClone = await marketRepository.findById(id);
    if (!marketToClone || id === 'market-bank') return null;

    const newMarketData = {
        ...marketToClone,
        id: `market-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: `${marketToClone.title} (Copy)`,
    };
    
    const saved = await marketRepository.create(newMarketData);
    updateEmitter.emit('update');
    return saved;
};

const bulkUpdateStatus = async (ids, statusType) => {
    if (!['open', 'closed'].includes(statusType)) {
        return;
    }
    await marketRepository.bulkUpdateStatus(ids, statusType);
    updateEmitter.emit('update');
};

const exchange = async (userId, payItem, receiveItem, guildId) => {
    return await dataSource.transaction(async manager => {
        const user = await manager.getRepository('User').findOneBy({ id: userId });
        const settings = await settingRepository.get();
        const rewardTypes = await rewardTypeRepository.findAll();

        if (!user || !settings) return null;

        const fromReward = rewardTypes.find(rt => rt.id === payItem.rewardTypeId);
        const toReward = rewardTypes.find(rt => rt.id === receiveItem.rewardTypeId);

        if (!fromReward || !toReward || fromReward.baseValue <= 0 || toReward.baseValue <= 0) return null;

        const { currencyExchangeFeePercent, xpExchangeFeePercent } = settings.rewardValuation;
        const feePercent = fromReward.category === 'Currency' ? currencyExchangeFeePercent : xpExchangeFeePercent;
        const feeMultiplier = 1 + (Number(feePercent) / 100);

        const toValueInReal = receiveItem.amount * toReward.baseValue;
        const fromAmountBase = toValueInReal / fromReward.baseValue;
        const provisionalTotalCost = fromAmountBase * feeMultiplier;
        const totalCost = Math.ceil(provisionalTotalCost);

        if (payItem.amount !== totalCost) {
            console.warn(`[Exchange Mismatch] Client cost: ${payItem.amount}, Server cost: ${totalCost}. Using server cost.`);
        }

        const isGuildScope = !!guildId;
        let balances = isGuildScope ? user.guildBalances[guildId] || { purse: {}, experience: {} } : { purse: user.personalPurse, experience: user.personalExperience };

        const fromBalance = (fromReward.category === 'Currency' ? balances.purse[fromReward.id] : balances.experience[fromReward.id]) || 0;
        if (fromBalance < totalCost) return null;

        if (fromReward.category === 'Currency') balances.purse[fromReward.id] = fromBalance - totalCost;
        else balances.experience[fromReward.id] = fromBalance - totalCost;

        const toBalance = (toReward.category === 'Currency' ? balances.purse[toReward.id] : balances.experience[toReward.id]) || 0;
        if (toReward.category === 'Currency') balances.purse[toReward.id] = toBalance + receiveItem.amount;
        else balances.experience[toReward.id] = toBalance + receiveItem.amount;

        const userUpdatePayload = isGuildScope ? { guildBalances: user.guildBalances } : { personalPurse: user.personalPurse, personalExperience: user.personalExperience };
        const updatedUser = await manager.getRepository('User').save(updateTimestamps(Object.assign(user, userUpdatePayload)));

        const chronicleRepo = manager.getRepository(ChronicleEventEntity);
        const eventData = {
            id: `chron-exchange-${Date.now()}`,
            originalId: `exchange-${Date.now()}`,
            date: new Date().toISOString(),
            type: 'Exchange',
            title: `Exchanged ${totalCost} ${fromReward.name} for ${receiveItem.amount} ${toReward.name}`,
            status: 'Exchanged',
            icon: '↔️',
            color: '#a855f7',
            userId: userId,
            userName: user.gameName,
            actorId: userId,
            actorName: user.gameName,
            guildId: guildId || undefined,
        };
        const newEvent = chronicleRepo.create(eventData);
        await manager.save(updateTimestamps(newEvent, true));

        updateEmitter.emit('update');
        return { updatedUser };
    });
};


module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    clone,
    bulkUpdateStatus,
    exchange,
};