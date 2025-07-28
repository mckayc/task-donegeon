
const express = require('express');
const router = express.Router();

// Import all route modules
router.use(require('./data'));
router.use(require('./users'));
router.use(require('./quests'));
router.use(require('./chat'));
router.use(require('./media'));
router.use(require('./ai'));
router.use(require('./backups'));
router.use(require('./economy'));

// Generic CRUD endpoints for simple resources
const createCrudEndpoints = require('./genericCrud');
[
    { resource: 'questGroups', prefix: 'qg' },
    { resource: 'rewardTypes', prefix: 'rt' },
    { resource: 'markets', prefix: 'mkt' },
    { resource: 'guilds', prefix: 'g' },
    { resource: 'trophies', prefix: 't' },
    { resource: 'themes', prefix: 'th' },
    { resource: 'scheduledEvents', prefix: 'se' },
    { resource: 'gameAssets', prefix: 'ga' },
].forEach(({ resource, prefix }) => {
    router.use(`/${resource}`, createCrudEndpoints(resource, prefix));
});

module.exports = router;
