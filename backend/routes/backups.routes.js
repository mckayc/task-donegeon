
const express = require('express');
const {
    getBackups,
    createJsonBackup,
    createSqliteBackup,
    downloadBackup,
    deleteBackup,
    bulkDeleteBackups,
    restoreFromBackup,
    restoreUpload,
} = require('../controllers/management.controller');

const router = express.Router();

router.get('/', getBackups);
router.post('/create-json', createJsonBackup);
router.post('/create-sqlite', createSqliteBackup);
router.get('/download/:filename', downloadBackup);
router.delete('/:filename', deleteBackup);
router.post('/bulk-delete', bulkDeleteBackups);
router.post('/restore-upload', restoreUpload, restoreFromBackup);

module.exports = router;
