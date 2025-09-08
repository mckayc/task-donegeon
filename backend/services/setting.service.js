const settingRepository = require('../repositories/setting.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const get = () => settingRepository.get();

const update = async (settings) => {
    const saved = await settingRepository.update(settings);
    updateEmitter.emit('update');
    return saved;
};

module.exports = {
    get,
    update,
};