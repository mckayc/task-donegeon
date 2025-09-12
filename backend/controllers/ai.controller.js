
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
        ? `The user is ${age} years old. You MUST adapt your tone, vocabulary, and sentence complexity to be easily understood by a ${age}-year-old.`
        : "Adapt your language for a general audience, assuming it could include children.";
    
    // --- 1. Generate the initial quiz ---
    const quizGenerationPrompt = `You are an AI Teacher. Your task is to create a short, 3 to 5 question multiple-choice quiz to assess a user's baseline knowledge on a topic. The quest is titled "${quest.title}" with description "${quest.description}". Each question must have 3 or 4 choices, with exactly one being correct. Crucially, you must also add a final choice for every question: "I don't know". This "I don't know" option must always have 'isCorrect' set to false. ${ageInstruction}`;

    const quizSchema = {
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
    };

    const quizResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: quizGenerationPrompt,
        config: { responseMimeType: "application/json", responseSchema: quizSchema }
    });

    const quiz = JSON.parse(quizResponse.text);

    // --- 2. Create the chat session for teaching ---
     const personalizationInstruction = `To make the lesson more engaging, here is some information about the user. Use this to create relevant analogies and examples where appropriate.
    - User's "About Me": "${user.aboutMe || 'Not provided.'}"
    - Private Admin Notes about user: "${user.adminNotes || 'Not provided.'}"`;

    const teachingSystemInstruction = `You are an AI Teacher helping a user learn about the quest titled "${quest.title}".
    Your style must be patient, encouraging, and conversational. Keep answers clear, concise, and educational.
    The user's name is ${user.gameName}.
    ${ageInstruction}
    ${personalizationInstruction}

    **Core Task: The "Teach, Check, Feedback" Loop**
    1.  **Teach:** Present a single, small, digestible piece of information (2-3 sentences). Use examples, especially ones related to the user's interests.
    2.  **Check:** Immediately after teaching, you MUST use the "ask_a_question_with_choices" tool to ask a simple multiple-choice question to verify understanding. The text in the 'question' parameter will be your message. Always include an "I don't know" option as the last choice.
    3.  **Feedback:** After the user answers, provide brief, positive feedback if correct, or a gentle correction and simple re-explanation if wrong, then transition to the next "Teach" step.

    **Operational Flow:**
    1.  **Analyze Quiz Results:** The very first message you receive will be a summary of a baseline quiz. Analyze their results to find their weakest topic. An "I don't know" answer is incorrect.
    2.  **Begin Lesson:** Your first response MUST be a brief, encouraging message stating which topic you will focus on. Then, immediately begin the "Teach, Check, Feedback" loop for that topic.
    3.  **Handle User Questions:** If the user asks a question at any point, pause your teaching loop, answer their question thoroughly and clearly, and then seamlessly resume teaching from where you left off.
    4.  **Provide Final Summary:** When you receive the message "The user has passed the final quiz.", your response must be a concise, bulleted summary of the 3-5 most important key takeaways from the entire lesson. This is your final message.

    **CRITICAL RULE:** Do NOT write XML tags or markdown lists for choices. You MUST use the 'ask_a_question_with_choices' tool for all multiple-choice questions. Your text response must be clean, conversational prose.`;

    const chat = await ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: teachingSystemInstruction },
        tools: [askAQuestionWithChoicesTool]
    });

    const sessionId = `chat-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    activeChats.set(sessionId, chat);

    setTimeout(() => {
        activeChats.delete(sessionId);
        console.log(`Cleaned up expired chat session: ${sessionId}`);
    }, 60 * 60 * 1000);

    res.status(201).json({ sessionId, quiz });
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
        
        const prompt = `Based on the following conversation history, generate a 3-question multiple-choice quiz in a strict JSON format. The quiz should test understanding of the key concepts discussed. For each question, provide 4 choices, with only one being correct. Crucially, you must also add a final choice for every question: "I don't know". This "I don't know" option must always have 'isCorrect' set to false.
        
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

const generateStory = async (req, res) => {
    if (!ai) {
        return res.status(400).json({ error: 'AI features are not configured on the server.' });
    }
    const { quest, user } = req.body;
    if (!quest || !user) {
        return res.status(400).json({ error: 'Quest and user data are required.' });
    }
    
    const age = calculateAge(user.birthday);
    const ageInstruction = age ? `The story should be suitable for a ${age}-year-old.` : 'The story should be suitable for all ages.';
    const personalization = user.aboutMe ? `The user's interests include: "${user.aboutMe}". Try to subtly incorporate these themes.` : '';

    const prompt = `You are a master storyteller. Write a short, imaginative story for a user named ${user.gameName}.
    ${ageInstruction}
    The story must be inspired by the following quest:
    - Title: "${quest.title}"
    - Description: "${quest.description}"
    ${personalization}
    The story should be between 200 and 400 words.
    Return the story as a single JSON object with two keys: "title" (a new, creative title for your story) and "story" (the full text of the story, with paragraph breaks using '\\n').`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        story: { type: Type.STRING }
                    },
                    required: ['title', 'story']
                }
            }
        });
        const storyData = JSON.parse(response.text);
        res.json({ story: storyData });
    } catch (error) {
        console.error("Gemini Story Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate a story.' });
    }
};


module.exports = {
    testApiKey: asyncMiddleware(testApiKey),
    generateContent: asyncMiddleware(generateContent),
    startChatSession: asyncMiddleware(startChatSession),
    sendMessageInSession: asyncMiddleware(sendMessageInSession),
    generateQuizForSession: asyncMiddleware(generateQuizForSession),
    generateStory: asyncMiddleware(generateStory),
    isAiConfigured: () => !!ai,
};