const { dataSource } = require('../data-source');
const { AppliedModifierEntity } = require('../entities');
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(AppliedModifierEntity);

const findAll = () => repo.find();
const findById = (id) => repo.findOneBy({ id });

const create = (data) => {
    const newItem = repo.create({
        ...data,
        id: `am-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    });
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
    create,
    update,
    deleteMany,
};