const { dataSource } = require('../data-source');
const { AITutorEntity } = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(AITutorEntity);

const getAll = () => repo.find();

const create = async (data) => {
    const newTutor = repo.create({
        ...data,
        id: `aitutor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    });
    const saved = await repo.save(updateTimestamps(newTutor, true));
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, data) => {
    const tutor = await repo.findOneBy({ id });
    if (!tutor) return null;
    repo.merge(tutor, data);
    const saved = await repo.save(updateTimestamps(tutor));
    updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids) => {
    await repo.delete(ids);
    updateEmitter.emit('update');
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
};
