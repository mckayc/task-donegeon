const { dataSource } = require('../data-source');
const { BugReportEntity } = require('../entities');
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(BugReportEntity);

const findAll = () => repo.find({ order: { createdAt: "DESC" } });
const findById = (id) => repo.findOneBy({ id });

const create = (data) => {
    const newItem = repo.create(data);
    return repo.save(updateTimestamps(newItem, true));
};

const createMany = async (reports, merge = false) => {
    if (!merge) {
        const newReports = reports.map(r => repo.create(updateTimestamps(r, true)));
        return repo.save(newReports);
    }
    // Merge logic
    const existingIds = (await repo.find({ select: ["id"] })).map(r => r.id);
    const newReports = reports
        .filter(r => !existingIds.includes(r.id))
        .map(r => repo.create(updateTimestamps(r, true)));
    if (newReports.length > 0) {
        return repo.save(newReports);
    }
    return [];
};

const update = async (id, data) => {
    const item = await findById(id);
    if (!item) return null;
    repo.merge(item, data);
    return repo.save(updateTimestamps(item));
};

const deleteMany = (ids) => repo.delete(ids);
const deleteAll = () => repo.clear();

module.exports = {
    findAll,
    findById,
    create,
    createMany,
    update,
    deleteMany,
    deleteAll,
};
