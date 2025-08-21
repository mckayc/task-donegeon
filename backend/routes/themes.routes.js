const express = require('express');
const { asyncMiddleware } = require('../utils/helpers');
const {
    getAllThemes,
    createTheme,
    updateTheme,
    deleteThemes,
} = require('../controllers/themes.controller');

const router = express.Router();

router.get('/', asyncMiddleware(getAllThemes));
router.post('/', asyncMiddleware(createTheme));
router.put('/:id', asyncMiddleware(updateTheme));
router.delete('/', asyncMiddleware(deleteThemes)); 

module.exports = router;
