
const guildRepository = require('../repositories/guild.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { dataSource } = require('../data-source');
const { logAdminAction } = require('../utils/helpers');
const { GuildEntity } = require('../entities');

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

const remove = async (ids, actorId) => {
    if (ids.length === 0) return;
    await dataSource.transaction(async manager => {
        const guildRepo = manager.getRepository(GuildEntity);
        const guildsToDelete = await guildRepo.findByIds(ids);

        if (actorId && guildsToDelete.length > 0) {
            await logAdminAction(manager, {
                actorId,
                title: `Deleted ${ids.length} Guild(s)`,
                note: guildsToDelete.map(g => g.name).join(', '),
                icon: '🗑️',
                color: '#ef4444'
            });
        }
        await guildRepo.delete(ids);
        updateEmitter.emit('update');
    });
};

module.exports = {
    getAll,
    create,
    update,
    remove,
};
