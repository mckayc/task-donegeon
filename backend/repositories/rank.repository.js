const { dataSource } = require('../data-source');
const { RankEntity } = require('../entities');
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(RankEntity);

const findAll = () => repo.find();
const findAllSorted = () => repo.find({ order: { xpThreshold: 'ASC' } });
const findById = (id) => repo.findOneBy({ id });

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

const replaceAll = (ranks) => {
    return dataSource.transaction(async manager => {
        const repo = manager.getRepository(RankEntity);
        await repo.clear();
        const newRanks = ranks.map(r => repo.create(updateTimestamps(r, true)));
        await repo.save(newRanks);
    });
};

module.exports = {
    findAll,
    findAllSorted,
    findById,
    create,
    update,
    deleteMany,
    replaceAll,
};