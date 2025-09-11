
const express = require('express');
const { fetchEpub } = require('../controllers/proxy.controller');

const router = express.Router();

router.get('/epub', fetchEpub);

module.exports = router;
