const { dataSource } = require('../data-source');
const { SettingEntity } = require('../entities');
const { INITIAL_SETTINGS } = require('../initialData');
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(SettingEntity);

const get = async () => {
    const settingRow = await repo.findOneBy({ id: 1 });
    return settingRow ? settingRow.settings : INITIAL_SETTINGS;
};

const update = async (settings) => {
    const saved = await repo.save(updateTimestamps({ id: 1, settings }));
    return saved.settings;
};

module.exports = {
    get,
    update,
};