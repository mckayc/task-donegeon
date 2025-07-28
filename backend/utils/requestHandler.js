
const { loadData, saveData } = require('../db');
const { broadcastUpdate } = require('../websocket');

const handleRequest = (logic) => async (req, res) => {
    try {
        const data = await loadData();
        // The logic function can now modify the 'data' object directly.
        const result = await logic(data, req, res); 
        
        await saveData(data);
        await broadcastUpdate();

        // Handle response
        if (result && result.status && result.body) {
            return res.status(result.status).json(result.body);
        }
        if (result && result.body) {
            return res.status(200).json(result.body);
        }
        
        // If logic function returns nothing, send 204 No Content
        return res.status(204).send();

    } catch (error) {
        console.error(`API Error on ${req.method} ${req.path}:`, error);
        res.status(500).json({ error: error.message || 'An internal server error occurred.' });
    }
};

module.exports = handleRequest;
