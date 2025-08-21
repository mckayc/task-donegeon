const assetService = require('../services/asset.service');

const getAllAssets = async (req, res) => {
    const assets = await assetService.getAll();
    res.json(assets);
};

const createAsset = async (req, res) => {
    const savedAsset = await assetService.create(req.body);
    res.status(201).json(savedAsset);
};

const updateAsset = async (req, res) => {
    const updatedAsset = await assetService.update(req.params.id, req.body);
    if (!updatedAsset) return res.status(404).send('Game asset not found');
    res.json(updatedAsset);
};

const cloneAsset = async (req, res) => {
    const clonedAsset = await assetService.clone(req.params.id);
    if (!clonedAsset) return res.status(404).send('Game asset not found');
    res.status(201).json(clonedAsset);
};

const deleteAssets = async (req, res) => {
    await assetService.deleteMany(req.body.ids);
    res.status(204).send();
};

const useItem = async (req, res) => {
    const { id: assetId } = req.params;
    const { userId } = req.body;
    const result = await assetService.use(assetId, userId);
    if (!result) return res.status(404).json({ error: 'Could not complete "use item" action.' });
    res.json(result);
};

const craftItem = async (req, res) => {
    const { id: assetId } = req.params;
    const { userId } = req.body;
    const result = await assetService.craft(assetId, userId);
    if (!result) return res.status(400).json({ error: 'Could not complete "craft item" action.' });
    res.json(result);
};

module.exports = {
    getAllAssets,
    createAsset,
    updateAsset,
    cloneAsset,
    deleteAssets,
    useItem,
    craftItem,
};