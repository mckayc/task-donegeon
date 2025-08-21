const rankRepository = require('../repositories/rank.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const getAll = () => rankRepository.findAllSorted();

const create = async (data) => {
    const newRank = {
        ...data,
        id: `rank-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    const saved = await rankRepository.create(newRank);
    updateEmitter.emit('update');
    return saved;
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

const deleteMany = async (ids) => {
    const ranksToDelete = await rankRepository.findByIds(ids);
    const nonDeletableRank = ranksToDelete.find(r => r.xpThreshold === 0);
    if (nonDeletableRank) {
        throw new Error('Cannot delete the base rank with 0 XP threshold.');
    }
    await rankRepository.deleteMany(ids);
    updateEmitter.emit('update');
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