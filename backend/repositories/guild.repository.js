const { dataSource } = require('../data-source');
const { GuildEntity, UserEntity } = require('../entities');
const { updateTimestamps } = require('../utils/helpers');
const { In } = require("typeorm");

const repo = dataSource.getRepository(GuildEntity);
const userRepo = dataSource.getRepository(UserEntity);

const findAllWithMembers = async () => {
    const guilds = await repo.find({ relations: ['members'] });
    return guilds.map(g => ({ ...g, memberIds: g.members.map(m => m.id) }));
};

const findById = (id) => repo.findOneBy({ id });
const findDefault = () => repo.findOne({ where: { isDefault: true } });

const create = async (data) => {
    const { memberIds, ...guildData } = data;
    const newGuild = repo.create(guildData);
    if (memberIds && memberIds.length > 0) {
        newGuild.members = await userRepo.findBy({ id: In(memberIds) });
    }
    return repo.save(updateTimestamps(newGuild, true));
};

const update = async (id, data) => {
    const guild = await repo.findOne({ where: { id }, relations: ['members'] });
    if (!guild) return null;

    const { memberIds, ...guildData } = data;
    repo.merge(guild, guildData);

    if (memberIds) {
        guild.members = await userRepo.findBy({ id: In(memberIds) });
    }

    return repo.save(updateTimestamps(guild));
};

const addMember = async (id, userId) => {
    const guild = await repo.findOne({ where: { id }, relations: ['members'] });
    const user = await userRepo.findOneBy({ id: userId });
    if (guild && user) {
        guild.members.push(user);
        return repo.save(updateTimestamps(guild));
    }
    return null;
};

const remove = (id) => repo.delete(id);

module.exports = {
    findAllWithMembers,
    findById,
    findDefault,
    create,
    update,
    addMember,
    remove,
};