const express = require('express');
const {
    getLocalGallery,
    uploadMedia,
    upload,
    browseMedia,
} = require('../controllers/management.controller');

const router = express.Router();

router.get('/local-gallery', getLocalGallery);
router.post('/upload/:category?', upload, uploadMedia);
router.get('/browse', browseMedia);

module.exports = router;