const { GoogleGenAI } = require('@google/genai');
const { asyncMiddleware } = require('../utils/helpers');
const { dataSource } = require('../data-source');
const { QuestEntity, UserEntity } = require('../entities');

let ai;
if (process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall') {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("WARNING: API_KEY environment variable not set or is default. AI features will be disabled.");
}

const activeChats = new Map(); // In-memory store for chat sessions

const testApiKey = async (req, res) => {
    if (!ai) {
        return res.status(400).json({ success: false, error: 'API_KEY is not configured on the server.' });
    }
    try {
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'test',
            config: {
                maxOutputTokens: 1,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Gemini API key test failed:", error.message);
        let errorMessage = 'The API key is invalid or has insufficient permissions.';
        if (error.message && typeof error.message === 'string') {
            if (error.message.includes('API_KEY_INVALID')) {
                errorMessage = 'The provided API key is invalid.';
            } else if (error.message.includes('permission')) {
                errorMessage = 'The API key does not have permission to access the Gemini API.';
            } else if (error.message.includes('fetch')) {
                errorMessage = 'A network error occurred while trying to contact the Google AI service.';
            }
        }
        res.status(400).json({ success: false, error: errorMessage });
    }
};

const generateContent = async (req, res) => {
    if (!ai) {
        return res.status(400).json({ error: 'AI features are not configured on the server.' });
    }
    const { model, prompt, generationConfig } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash',
            contents: prompt,
            config: generationConfig,
        });
        res.json({ text: response.text });
    } catch (error) {
        console.error("Gemini AI Error:", error);
        res.status(500).json({ error: error.message || 'An error occurred while communicating with the AI.' });
    }
};

const startChatSession = async (req, res) => {
    if (!ai) {
        return res.status(400).json({ error: 'AI features are not configured on the server.' });
    }
    const { questId, userId } = req.body;
    if (!questId || !userId) {
        return res.status(400).json({ error: 'questId and userId are required.' });
    }

    const questRepo = dataSource.getRepository(QuestEntity);
    const userRepo = dataSource.getRepository(UserEntity);

    const quest = await questRepo.findOneBy({ id: questId });
    const user = await userRepo.findOneBy({ id: userId });

    if (!quest || !user) {
        return res.status(404).json({ error: 'Quest or User not found.' });
    }

    const systemInstruction = `You are an AI Teacher designed to help a user learn about a specific topic.
    The user's name is ${user.gameName}, and they are learning about the quest titled "${quest.title}".
    Use the quest's description for context: "${quest.description}".
    Your personality should be that of a friendly, encouraging, and knowledgeable guide.
    Keep the conversation focused on the quest's topic. If the user asks about something unrelated, gently steer them back to the topic.
    Adapt your language and the complexity of your explanations to be suitable for someone with a birthday of ${user.birthday}. Do not mention their birthday directly.
    Your goal is to facilitate learning through interactive conversation.`;

    const chat = await ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
        },
    });

    const sessionId = `chat-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    activeChats.set(sessionId, chat);

    // Set a timeout to clean up the chat session after a while (e.g., 1 hour)
    setTimeout(() => {
        activeChats.delete(sessionId);
        console.log(`Cleaned up expired chat session: ${sessionId}`);
    }, 60 * 60 * 1000);

    res.status(201).json({ sessionId });
};

const sendMessageInSession = async (req, res) => {
    if (!ai) {
        return res.status(400).json({ error: 'AI features are not configured on the server.' });
    }
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
        return res.status(400).json({ error: 'sessionId and message are required.' });
    }

    const chat = activeChats.get(sessionId);
    if (!chat) {
        return res.status(404).json({ error: 'Chat session not found or has expired.' });
    }

    try {
        const response = await chat.sendMessage({ message });
        res.json({ reply: response.text });
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        res.status(500).json({ error: 'Failed to get a response from the AI.' });
    }
};

module.exports = {
    testApiKey: asyncMiddleware(testApiKey),
    generateContent: asyncMiddleware(generateContent),
    startChatSession: asyncMiddleware(startChatSession),
    sendMessageInSession: asyncMiddleware(sendMessageInSession),
    isAiConfigured: () => !!ai,
};