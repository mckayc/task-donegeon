const bugReportRepository = require('../repositories/bugReport.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');

const getAll = () => bugReportRepository.findAll();

const create = async (reportData) => {
    const newReport = {
        ...reportData,
        id: `bug-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    const saved = await bugReportRepository.create(newReport);
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, updates) => {
    const saved = await bugReportRepository.update(id, updates);
    if (saved) {
        updateEmitter.emit('update');
    }
    return saved;
};

const deleteMany = async (ids) => {
    await bugReportRepository.deleteMany(ids);
    updateEmitter.emit('update');
};

const importMany = async (reports, mode) => {
    if (mode === 'replace') {
        await bugReportRepository.deleteAll();
    }
    const savedReports = await bugReportRepository.createMany(reports, mode === 'merge');
    updateEmitter.emit('update');
    return savedReports;
};


module.exports = {
    getAll,
    create,
    update,
    deleteMany,
    importMany,
};
