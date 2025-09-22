const express = require('express');
const multer = require('multer');
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

router.get('/', getBackups);
router.post('/create-json', createJsonBackup);
router.post('/create-sqlite', createSqliteBackup);
router.get('/download/:filename', downloadBackup);
router.delete('/:filename', deleteBackup);
router.post('/bulk-delete', bulkDeleteBackups);
router.post('/restore-upload', restoreUpload.single('backupFile'), restoreFromBackup);

module.exports = router;