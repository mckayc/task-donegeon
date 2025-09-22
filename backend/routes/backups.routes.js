
const express = require('express');
const multer = require('multer');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getBackups,
    createJsonBackup,
    createSqliteBackup,
    downloadBackup,
    deleteBackup,
    bulkDeleteBackups,
    restoreFromBackup,
} = require('../controllers/management.controller');

const router = express.Router();
const restoreUpload = multer({ dest: '/tmp/' });

router.get('/', asyncMiddleware(getBackups));
router.post('/create-json', asyncMiddleware(createJsonBackup));
router.post('/create-sqlite', asyncMiddleware(createSqliteBackup));
router.get('/download/:filename', asyncMiddleware(downloadBackup));
router.delete('/:filename', asyncMiddleware(deleteBackup));
router.post('/bulk-delete', asyncMiddleware(bulkDeleteBackups));
router.post('/restore-upload', restoreUpload.single('backupFile'), asyncMiddleware(restoreFromBackup));

module.exports = router;