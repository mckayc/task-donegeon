const express = require('express');
const {
    discoverAssetPacks,
    getAssetPack,
    fetchRemoteAssetPack,
} = require('../controllers/management.controller');

const router = express.Router();

router.get('/discover', discoverAssetPacks);
router.get('/get/:filename', getAssetPack);
router.get('/fetch-remote', fetchRemoteAssetPack);

module.exports = router;
