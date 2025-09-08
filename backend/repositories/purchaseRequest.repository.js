const { dataSource } = require('../data-source');
const { PurchaseRequestEntity } = require('../entities');
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(PurchaseRequestEntity);

const create = (data) => {
    const newItem = repo.create({
        ...data,
        id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    });
    return repo.save(updateTimestamps(newItem, true));
};

const findById = (id) => repo.findOneBy({ id });

const update = async (id, data) => {
    const item = await findById(id);
    if (!item) return null;
    repo.merge(item, data);
    return repo.save(updateTimestamps(item));
};

module.exports = {
    create,
    findById,
    update,
};