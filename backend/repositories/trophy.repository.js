const { dataSource } = require('../data-source');
const { TrophyEntity, UserTrophyEntity } = require('../entities');
const { IsNull } = require("typeorm");
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(TrophyEntity);
const userTrophyRepo = dataSource.getRepository(UserTrophyEntity);

const findAll = () => repo.find();
const findById = (id) => repo.findOneBy({ id });
const findAutomatic = () => repo.findBy({ isManual: false });

const create = (data) => {
    const newItem = repo.create(data);
    return repo.save(updateTimestamps(newItem, true));
};

const update = async (id, data) => {
    const item = await findById(id);
    if (!item) return null;
    repo.merge(item, data);
    return repo.save(updateTimestamps(item));
};

const deleteMany = (ids) => repo.delete(ids);

// --- UserTrophy ---
const findUserTrophies = (userId, guildId) => {
    const whereClause = { userId };
    if (guildId === null) {
        whereClause.guildId = IsNull();
    } else if (guildId) {
        whereClause.guildId = guildId;
    }
    return userTrophyRepo.find({ where: whereClause });
};

const createUserTrophy = (data) => {
    const newItem = userTrophyRepo.create({
        ...data,
        id: `usertrophy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    });
    return userTrophyRepo.save(updateTimestamps(newItem, true));
};

module.exports = {
    findAll,
    findById,
    findAutomatic,
    create,
    update,
    deleteMany,
    findUserTrophies,
    createUserTrophy,
};