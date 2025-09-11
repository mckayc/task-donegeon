const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    parseEpubMetadata,
    getEpubChapter
} = require('../controllers/epub.controller');

const router = express.Router();

router.get('/metadata', asyncMiddleware(parseEpubMetadata));
router.get('/chapter', asyncMiddleware(getEpubChapter));

module.exports = router;
