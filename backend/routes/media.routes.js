const express = require('express');
const {
    getLocalGallery,
    uploadMedia,
    upload,
    browseMedia,
    uploadToMediaLibrary,
    mediaUpload,
    createMediaFolder,
    moveMediaItem,
} = require('../controllers/management.controller');

const router = express.Router();

router.get('/local-gallery', getLocalGallery);
router.post('/upload/asset-gallery/:category?', upload, uploadMedia); // Kept for asset gallery
router.post('/upload/library', mediaUpload, uploadToMediaLibrary); // New route for media library
router.post('/create-folder', createMediaFolder);
router.post('/move', moveMediaItem);
router.get('/browse', browseMedia);

module.exports = router;