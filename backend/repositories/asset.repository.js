const { dataSource } = require('../data-source');
const { GameAssetEntity } = require('../entities');
const { updateTimestamps } = require('../utils/helpers');

const repo = dataSource.getRepository(GameAssetEntity);

const findAll = () => repo.find();
const findById = (id) => repo.findOneBy({ id });

const create = (assetData) => {
    const newAsset = repo.create(assetData);
    return repo.save(updateTimestamps(newAsset, true));
};

const update = async (id, assetData) => {
    const asset = await findById(id);
    if (!asset) return null;
    repo.merge(asset, assetData);
    return repo.save(updateTimestamps(asset));
};

const deleteMany = (ids) => repo.delete(ids);

module.exports = {
    findAll,
    findById,
    create,
    update,
    deleteMany,
};