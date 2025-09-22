const tradeRepository = require('../repositories/trade.repository');
const { dataSource } = require('../data-source');
const { TradeOfferEntity, UserEntity, SystemNotificationEntity } = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');

const getAll = () => tradeRepository.findAll();

const create = async (data) => {
    const newTrade = { ...data, id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    const saved = await tradeRepository.create(newTrade);
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, data) => {
    return await dataSource.transaction(async manager => {
        const tradeRepo = manager.getRepository(TradeOfferEntity);
        const trade = await tradeRepo.findOneBy({ id });
        if (!trade) return null;

        const oldStatus = trade.status;
        tradeRepo.merge(trade, data);
        const saved = await tradeRepo.save(updateTimestamps(trade));

        if (saved.status === 'OfferUpdated' && oldStatus !== 'OfferUpdated' && (data.initiatorLocked || data.recipientLocked)) {
            const userRepo = manager.getRepository(UserEntity);
            const initiator = await userRepo.findOneBy({ id: saved.initiatorId });
            const recipient = await userRepo.findOneBy({ id: saved.recipientId });
            
            const actor = (data.initiatorLocked) ? initiator : recipient;
            const notificationRecipient = (data.initiatorLocked) ? recipient : initiator;

            if (actor && notificationRecipient) {
                const notificationRepo = manager.getRepository(SystemNotificationEntity);
                const notification = notificationRepo.create({
                    id: `sysnotif-tradeupdate-${saved.id}`,
                    senderId: actor.id,
                    type: 'TradeOfferUpdated',
                    message: `${actor.gameName} has updated their trade offer.`,
                    recipientUserIds: [notificationRecipient.id],
                    readByUserIds: [],
                    link: 'Approvals',
                    guildId: saved.guildId,
                });
                await manager.save(updateTimestamps(notification, true));
            }
        }
        
        updateEmitter.emit('update');
        return saved;
    });
};

const deleteMany = async (ids) => {
    await tradeRepository.deleteMany(ids);
    updateEmitter.emit('update');
};

const propose = async (initiatorId, recipientId, guildId) => {
    const newTradeData = {
        initiatorId,
        recipientId,
        guildId,
        status: 'Pending',
        initiatorOffer: { assetIds: [], rewards: [] },
        recipientOffer: { assetIds: [], rewards: [] },
        initiatorLocked: false,
        recipientLocked: false,
    };
    return await create(newTradeData);
};

const accept = async (id) => {
    return await dataSource.transaction(async manager => {
        // This would contain complex logic to verify items and funds,
        // then transfer them between users.
        const trade = await manager.findOneBy(TradeOfferEntity, { id });
        if (!trade) return null;
        
        // Placeholder for transfer logic
        console.log(`Trade ${id} accepted. (Logic not fully implemented)`);

        trade.status = 'Completed';
        const saved = await manager.save(updateTimestamps(trade));
        
        const initiator = await manager.findOneBy(UserEntity, { id: trade.initiatorId });
        const recipient = await manager.findOneBy(UserEntity, { id: trade.recipientId });
        const notificationRepo = manager.getRepository(SystemNotificationEntity);

        if (initiator && recipient) {
            // Notify initiator
            const notif1 = notificationRepo.create({
                id: `sysnotif-tradeaccept-${trade.id}-1`,
                type: 'TradeAccepted',
                message: `${recipient.gameName} accepted your trade offer.`,
                recipientUserIds: [initiator.id],
                senderId: recipient.id,
                link: 'Chronicles',
                guildId: trade.guildId,
            });
            // Notify recipient (of their own action)
            const notif2 = notificationRepo.create({
                id: `sysnotif-tradeaccept-${trade.id}-2`,
                type: 'TradeAccepted',
                message: `You accepted the trade offer from ${initiator.gameName}.`,
                recipientUserIds: [recipient.id],
                senderId: initiator.id,
                link: 'Chronicles',
                guildId: trade.guildId,
            });
            await manager.save([updateTimestamps(notif1, true), updateTimestamps(notif2, true)]);
        }

        updateEmitter.emit('update');
        return saved;
    });
};

const resolve = async (id, action, actorId) => {
    return await dataSource.transaction(async manager => {
        const tradeRepo = manager.getRepository(TradeOfferEntity);
        const trade = await tradeRepo.findOneBy({ id });
        if (!trade) return null;

        const status = action === 'cancelled' ? 'Cancelled' : 'Rejected';
        trade.status = status;
        const saved = await tradeRepo.save(updateTimestamps(trade));

        const userRepo = manager.getRepository(UserEntity);
        const initiator = await userRepo.findOneBy({ id: trade.initiatorId });
        const recipient = await userRepo.findOneBy({ id: trade.recipientId });
        const actor = await userRepo.findOneBy({ id: actorId });
        
        if (initiator && recipient && actor) {
            const notificationRecipient = actor.id === initiator.id ? recipient : initiator;
            
            const notificationRepo = manager.getRepository(SystemNotificationEntity);
            const notification = notificationRepo.create({
                id: `sysnotif-traderesolve-${trade.id}`,
                type: status === 'Cancelled' ? 'TradeCancelled' : 'TradeRejected',
                message: `${actor.gameName} ${action} the trade offer.`,
                recipientUserIds: [notificationRecipient.id],
                senderId: actor.id,
                link: 'Chronicles',
                guildId: trade.guildId,
            });
            await manager.save(updateTimestamps(notification, true));
        }

        updateEmitter.emit('update');
        return saved;
    });
};

const cancelOrRejectTrade = async (id, action) => {
    // In a real app, actorId would be passed from an auth middleware.
    // For now, this is a placeholder. It needs to be passed from controller.
    const actorId = 'placeholder'; 
    return resolve(id, action, actorId);
};


module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    propose,
    accept,
    resolve,
    cancelOrRejectTrade, // Keep old export for now to not break controller
};