const themeRepository = require('../repositories/theme.repository');
const { updateEmitter } = require('../utils/updateEmitter');

const getAll = () => themeRepository.findAll();

const create = async (data) => {
    const newTheme = {
        ...data,
        id: `theme-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        isCustom: true,
    };
    const saved = await themeRepository.create(newTheme);
    updateEmitter.emit('update');
    return saved;
};

const update = async (id, data) => {
    const { isCustom, ...updateData } = data; // Prevent changing isCustom status
    const saved = await themeRepository.update(id, updateData);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids) => {
    const themesToDelete = await themeRepository.findByIds(ids);
    const customThemeIds = themesToDelete.filter(t => t.isCustom).map(t => t.id);
    if (customThemeIds.length > 0) {
        await themeRepository.deleteMany(customThemeIds);
        updateEmitter.emit('update');
    }
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
};