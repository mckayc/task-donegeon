const guildRepository = require('../repositories/guild.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const getAll = () => guildRepository.findAllWithMembers();

const create = async (guildData) => {
    const newGuild = {
        ...guildData,
        id: `guild-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    const saved = await guildRepository.create(newGuild);
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, guildData) => {
    const saved = await guildRepository.update(id, guildData);
    if (saved) {
        updateEmitter.emit('update');
    }
    return saved;
};

const remove = async (id) => {
    await guildRepository.remove(id);
    updateEmitter.emit('update');
};

module.exports = {
    getAll,
    create,
    update,
    remove,
};