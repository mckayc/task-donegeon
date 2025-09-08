const express = require('express');
const {
    discoverImagePacks,
    getImagePackDetails,
    importImagePack,
} = require('../controllers/management.controller');

const router = express.Router();

router.get('/', discoverImagePacks);
router.get('/:packName', getImagePackDetails);
router.post('/import', importImagePack);

module.exports = router;
