const { dataSource } = require('../data-source');
const { AdminAdjustmentEntity } = require('../entities');
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(AdminAdjustmentEntity);

const findAll = () => repo.find();
const findById = (id) => repo.findOneBy({ id });

const create = (data) => {
    const newItem = repo.create({
        ...data,
        id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    });
    return repo.save(updateTimestamps(newItem, true));
};

module.exports = {
    findAll,
    findById,
    create,
};
