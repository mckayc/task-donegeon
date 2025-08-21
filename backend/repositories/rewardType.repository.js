const { dataSource } = require('../data-source');
const { RewardTypeDefinitionEntity } = require('../entities');
const { In } = require("typeorm");
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(RewardTypeDefinitionEntity);

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

module.exports = {
    findAll,
    findById,
    findByIds,
    create,
    update,
    deleteMany,
};