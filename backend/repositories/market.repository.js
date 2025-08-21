const { dataSource } = require('../data-source');
const { MarketEntity } = require('../entities');
const { updateTimestamps } = require('../utils/helpers');
const { In } = require("typeorm");

const repo = dataSource.getRepository(MarketEntity);

const findAll = () => repo.find();
const findById = (id) => repo.findOneBy({ id });
const findByIds = (ids) => repo.findBy({ id: In(ids) });

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

const bulkUpdateStatus = async (ids, statusType) => {
    const marketsToUpdate = await findByIds(ids);
    for (const market of marketsToUpdate) {
        if (market.status.type !== 'conditional') {
            market.status = { type: statusType };
            updateTimestamps(market);
        }
    }
    await repo.save(marketsToUpdate);
};

module.exports = {
    findAll,
    findById,
    findByIds,
    create,
    update,
    deleteMany,
    bulkUpdateStatus,
};