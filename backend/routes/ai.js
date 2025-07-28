
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const router = express.Router();

const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

router.get('/ai/status', (req, res) => res.json({ isConfigured: !!ai }));

router.post('/ai/test', async (req, res) => {
    if (!ai) return res.status(400).json({ error: 'API key not configured on server.' });
    try {
        await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
        res.json({ success: true, message: 'API key is valid.' });
    } catch (e) { 
        console.error("AI Test Error:", e);
        res.status(500).json({ error: 'API key test failed. Check server logs for details.' }); 
    }
});

router.post('/ai/generate', async (req, res) => {
    if (!ai) return res.status(400).json({ error: 'AI not configured on server.' });
    try {
        const { prompt, generationConfig, model } = req.body;
        const response = await ai.models.generateContent({ model: model || 'gemini-2.5-flash', contents: prompt, config: generationConfig });
        // The response from the SDK is an object, but we send the text part back to the client
        // to match its expectation.
        res.json({ text: response.text });
    } catch (e) { 
        console.error("AI Generation Error:", e);
        res.status(500).json({ error: e.message }); 
    }
});

module.exports = router;
