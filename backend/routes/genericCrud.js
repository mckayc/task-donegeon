
const express = require('express');
const handleRequest = require('../utils/requestHandler');

const createCrudRouter = (resourceName, prefix) => {
    const router = express.Router();

    router.post('/', handleRequest((data, req) => {
        const newItem = { ...req.body, id: `${prefix}-${Date.now()}` };
        if(resourceName === 'gameAssets') {
            Object.assign(newItem, { creatorId: 'system', createdAt: new Date().toISOString(), purchaseCount: 0 });
        }
        data[resourceName].push(newItem);
        return { status: 201, body: newItem };
    }));

    router.put('/:id', handleRequest((data, req) => {
        const index = data[resourceName].findIndex(i => i.id === req.params.id);
        if (index === -1) throw new Error(`${resourceName} not found.`);
        data[resourceName][index] = { ...data[resourceName][index], ...req.body };
    }));

    router.delete('/:id', handleRequest((data, req) => {
        data[resourceName] = data[resourceName].filter(i => i.id !== req.params.id);
    }));
    
    return router;
};

module.exports = createCrudRouter;
