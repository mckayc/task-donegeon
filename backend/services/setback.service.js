const setbackRepository = require('../repositories/setback.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const getAll = () => setbackRepository.findAll();

const create = async (data) => {
    const newSetback = {
        ...data,
        id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    const saved = await setbackRepository.create(newSetback);
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, data) => {
    const saved = await setbackRepository.update(id, data);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids) => {
    await setbackRepository.deleteMany(ids);
    updateEmitter.emit('update');
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
};