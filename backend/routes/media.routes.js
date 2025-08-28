const express = require('express');
const {
    getLocalGallery,
    uploadMedia,
    upload,
} = require('../controllers/management.controller');

const router = express.Router();

router.get('/local-gallery', getLocalGallery);
router.post('/upload/:category?', upload, uploadMedia);

module.exports = router;