const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllBugReports,
    createBugReport,
    updateBugReport,
    deleteBugReports,
    importBugReports,
} = require('../controllers/bugReports.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllBugReports));
router.post('/', asyncMiddleware(createBugReport));
router.put('/:id', asyncMiddleware(updateBugReport));
router.delete('/', asyncMiddleware(deleteBugReports));
router.post('/import', asyncMiddleware(importBugReports));

module.exports = router;
