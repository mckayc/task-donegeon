const tradeRepository = require('../repositories/trade.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const getAll = () => tradeRepository.findAll();

const create = async (data) => {
    const newTrade = { ...data, id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    const saved = await tradeRepository.create(newTrade);
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, data) => {
    const saved = await tradeRepository.update(id, data);
    if (saved) updateEmitter.emit('update');
    return saved;
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
    // This would contain complex logic to verify items and funds,
    // then transfer them between users.
    console.log(`Trade ${id} accepted. (Logic not fully implemented)`);
    // Placeholder for now
    const trade = await tradeRepository.findById(id);
    if (trade) {
        trade.status = 'Completed';
        return await update(id, trade);
    }
    return null;
};

const resolve = async (id, action) => {
    const status = action === 'cancelled' ? 'Cancelled' : 'Rejected';
    const updated = await update(id, { status });
    return updated;
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    propose,
    accept,
    resolve,
};