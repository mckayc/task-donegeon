const themeRepository = require('../repositories/theme.repository');
const { updateEmitter } = require('../utils/updateEmitter');
const { dataSource } = require('../data-source');
const { logAdminAssetAction } = require('../utils/helpers');


const getAll = () => themeRepository.findAll();

const create = async (data) => {
    return await dataSource.transaction(async manager => {
        const newTheme = {
            ...data,
            id: `theme-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            isCustom: true,
        };
        const saved = await manager.getRepository('ThemeDefinition').save(newTheme);
        await logAdminAssetAction(manager, { actorId: data.actorId, actionType: 'create', assetType: 'Theme', assetCount: 1, assetName: saved.name });
        updateEmitter.emit('update');
        return saved;
    });
};

const update = async (id, data) => {
    const { isCustom, ...updateData } = data; // Prevent changing isCustom status
    const saved = await themeRepository.update(id, updateData);
    if (saved) updateEmitter.emit('update');
    return saved;
};

const deleteMany = async (ids, actorId) => {
    return await dataSource.transaction(async manager => {
        const themesToDelete = await manager.getRepository('ThemeDefinition').findBy({ id: In(ids) });
        const customThemeIds = themesToDelete.filter(t => t.isCustom).map(t => t.id);
        if (customThemeIds.length > 0) {
            await manager.getRepository('ThemeDefinition').delete(customThemeIds);
            await logAdminAssetAction(manager, { actorId, actionType: 'delete', assetType: 'Theme', assetCount: customThemeIds.length });
            updateEmitter.emit('update');
        }
    });
};

module.exports = {
    getAll,
    create,
    update,
    deleteMany,
};