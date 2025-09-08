const { dataSource } = require('../data-source');
const { QuestCompletionEntity } = require('../entities');
const { IsNull } = require("typeorm");
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(QuestCompletionEntity);

const create = (data) => {
    const newItem = repo.create(data);
    return repo.save(updateTimestamps(newItem, true));
};

const findById = (id) => repo.findOneBy({ id });
const findByIdWithRelations = (id) => repo.findOne({ where: { id }, relations: ['user', 'quest'] });

const findForUser = (userId, guildId) => {
    const whereClause = { user: { id: userId } };
    if (guildId === null) {
        whereClause.guildId = IsNull();
    } else if (guildId) {
        whereClause.guildId = guildId;
    }
    return repo.find({ where: whereClause, relations: ['quest'] });
};

const update = async (id, data) => {
    const item = await findById(id);
    if (!item) return null;
    repo.merge(item, data);
    return repo.save(updateTimestamps(item));
};

module.exports = {
    create,
    findById,
    findByIdWithRelations,
    findForUser,
    update,
};