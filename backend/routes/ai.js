
const express = require('express');

module.exports = (ai) => {
    const router = express.Router();

    if (!ai) {
        // If AI client is not initialized, return a router that gracefully handles requests.
        const disabledHandler = (req, res) => res.status(503).json({ error: "AI features are not configured on the server. An API_KEY is missing." });
        router.post('/generate', disabledHandler);
        router.post('/test', disabledHandler);
        return router;
    }

    router.post('/generate', async (req, res) => {
        try {
            const { prompt, generationConfig, model = 'gemini-2.5-flash' } = req.body;
            if (!prompt) {
                return res.status(400).json({ error: 'A prompt is required.' });
            }

            const response = await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: generationConfig || {},
            });

            res.json(response);
        } catch (error) {
            console.error('Gemini API Error:', error);
            res.status(500).json({ error: `An error occurred while communicating with the Gemini API: ${error.message}` });
        }
    });
    
    router.post('/test', async (req, res) => {
        try {
            await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
            res.json({ success: true, message: 'Gemini API key is valid and connected.' });
        } catch (error) {
            console.error('Gemini API Test Error:', error);
            res.status(500).json({ success: false, error: 'Failed to connect to the Gemini API. Please check your key.' });
        }
    });

    return router;
};
