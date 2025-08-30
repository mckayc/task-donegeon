
const { GoogleGenAI, Type } = require('@google/genai');
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

const showMultipleChoiceTool = {
  functionDeclarations: [
    {
      name: "show_multiple_choice",
      description: "Presents a multiple-choice or simple choice question to the user and displays the options as buttons.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "The question to ask the user. This will be displayed as the AI's text message."
          },
          choices: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            },
            description: "An array of 2 to 4 short choices to present as buttons."
          }
        },
        required: ["question", "choices"]
      }
    }
  ]
};

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

    **Interaction Rules:**
    1.  **Introduction Format:** Your VERY FIRST message must follow this structure EXACTLY:
        -   Start with a general overview of the topic.
        -   Share one specific, interesting fact or tidbit related to the topic.
        -   Ask a question to understand what the user wants to focus on, offering a few specific areas.
        -   Ask a follow-up question to gauge the user's existing knowledge on the topic.
    2.  **Interactive Choices:** You have access to a tool called "show_multiple_choice". When you ask a simple choice question (e.g., "Do you want to learn about A or B?"), you MUST call this tool. Provide the question text in the 'question' parameter and the choices in the 'choices' parameter. Do NOT use this tool for open-ended questions.
    3.  **Be Proactive:** Throughout the conversation, occasionally ask questions to check for understanding.`;

    const chat = await ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
        },
        tools: [showMultipleChoiceTool]
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
        const parts = response.candidates[0].content.parts;
        const textPart = parts.find(part => part.text);
        const functionCallPart = parts.find(part => part.functionCall);

        res.json({
            reply: textPart ? textPart.text : '',
            functionCall: functionCallPart ? functionCallPart.functionCall : null,
        });
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        res.status(500).json({ error: 'Failed to get a response from the AI.' });
    }
};

const generateQuizForSession = async (req, res) => {
    if (!ai) {
        return res.status(400).json({ error: 'AI features are not configured on the server.' });
    }
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required.' });
    }

    const chat = activeChats.get(sessionId);
    if (!chat) {
        return res.status(404).json({ error: 'Chat session not found or has expired.' });
    }

    try {
        const history = await chat.getHistory();
        const conversationText = history.map(h => `${h.role}: ${h.parts.map(p => p.text).join(' ')}`).join('\n');
        
        const prompt = `Based on the following conversation history, generate a 3-question multiple-choice quiz in a strict JSON format. The quiz should test understanding of the key concepts discussed. For each question, provide 4 choices, with only one being correct.
        
        Conversation History:
        ${conversationText}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    choices: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                text: { type: Type.STRING },
                                                isCorrect: { type: Type.BOOLEAN }
                                            },
                                            required: ['text', 'isCorrect']
                                        }
                                    }
                                },
                                required: ['question', 'choices']
                            }
                        }
                    },
                    required: ['questions']
                }
            }
        });

        res.json({ quiz: JSON.parse(response.text) });

    } catch (error) {
        console.error("Gemini Quiz Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate a quiz from the conversation.' });
    }
};

module.exports = {
    testApiKey: asyncMiddleware(testApiKey),
    generateContent: asyncMiddleware(generateContent),
    startChatSession: asyncMiddleware(startChatSession),
    sendMessageInSession: asyncMiddleware(sendMessageInSession),
    generateQuizForSession: asyncMiddleware(generateQuizForSession),
    isAiConfigured: () => !!ai,
};