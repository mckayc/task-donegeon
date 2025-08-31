
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

const askAQuestionWithChoicesTool = {
  functionDeclarations: [
    {
      name: "ask_a_question_with_choices",
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

// Helper function to calculate age from a YYYY-MM-DD birthday string
function calculateAge(birthdayString) {
    if (!birthdayString) return null;
    const birthDate = new Date(birthdayString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

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

    const age = calculateAge(user.birthday);
    const ageInstruction = age !== null
        ? `The user is ${age} years old. **CRITICAL INSTRUCTION:** You MUST adapt your tone, vocabulary, and sentence complexity to be easily understood by a ${age}-year-old. Simplify concepts and use age-appropriate analogies.`
        : "Adapt your language for a general audience, assuming it could include children.";

    const systemInstruction = `You are an AI Teacher helping a user learn about a specific topic.
    The user's name is ${user.gameName}.
    They are learning about the quest titled "${quest.title}".
    Use the quest's description for context: "${quest.description}".
    Your personality is a friendly, encouraging, and knowledgeable guide.
    
    ${ageInstruction}
    
    **CRITICAL RULE:** Under no circumstances should you ever write XML tags like <multiple_choice> or markdown lists or code blocks in your response. You MUST use the 'ask_a_question_with_choices' tool to present choices. Your text response should be clean, conversational prose ONLY.

    **Teaching Methodology: "Teach, Check, Feedback" Loop**
    You MUST follow this structured teaching loop for the entire conversation after your initial introduction:
    1.  **Teach:** Present a single, small, digestible piece of information about the quest's topic. Keep it concise (2-3 sentences).
    2.  **Check:** Immediately after teaching, you MUST use the "ask_a_question_with_choices" tool to ask a simple multiple-choice question that verifies the user understood the concept you just taught. This is not optional. When you use this tool, the text in the 'question' parameter will be displayed to the user.
    3.  **Feedback:** After the user answers, provide brief, positive feedback if they are correct, or a gentle correction if they are wrong, and then smoothly transition to the next "Teach" step.

    **Initial Introduction:** Your VERY FIRST message must still follow the introduction format:
    1. A general overview of the topic.
    2. An interesting fact.
    3. A question about what the user wants to focus on (using the "ask_a_question_with_choices" tool).
    4. A question to gauge prior knowledge (can be open-ended or use the tool).
    After this introduction, you must begin the "Teach, Check, Feedback" loop.`;

    const chat = await ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
        },
        tools: [askAQuestionWithChoicesTool]
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
        const response = await chat.sendMessage({ message: message });
        const parts = response.candidates[0].content.parts;
        let textPart = parts.find(part => part.text);
        let functionCallPart = parts.find(part => part.functionCall);

        let replyText = textPart ? textPart.text : '';

        // Fallback for models that embed tool calls as text
        if (replyText && !functionCallPart && replyText.includes('call:ask_a_question_with_choices')) {
            // This regex is very specific to the observed output format
            const toolCallRegex = /<ctrl\d+>call:(\w+)\s*({.*})/; 
            const match = replyText.match(toolCallRegex);

            if (match && match[1] === 'ask_a_question_with_choices' && match[2]) {
                try {
                    const args = JSON.parse(match[2]);
                    
                    // Reconstruct the functionCallPart object that the frontend expects
                    functionCallPart = {
                        name: 'ask_a_question_with_choices',
                        args: args
                    };

                    // Clean the tool call string from the main reply text
                    replyText = replyText.replace(toolCallRegex, '').trim();

                } catch (e) {
                    console.error("AI Controller: Failed to parse embedded tool call JSON.", e);
                    // If JSON is malformed, just strip the bad string and proceed without choices
                    replyText = replyText.replace(/<ctrl\d+>call:(\w+)\s*({.*})/, '').trim();
                }
            }
        }
        
        // Another safeguard for other weird formats
        replyText = replyText.replace(/<tool_code>[\s\S]*?<\/tool_code>/g, '').trim();
        replyText = replyText.replace(/<\/?multiple_choice>|<\/?question>|<\/?option>/g, '').trim();

        res.json({
            reply: replyText,
            functionCall: functionCallPart ? functionCallPart : null,
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
