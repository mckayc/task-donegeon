


const { GoogleGenAI, Type } = require('@google/genai');
const { asyncMiddleware } = require('../utils/helpers');
const { dataSource } = require('../data-source');
const { QuestEntity, UserEntity, AITutorEntity } = require('../entities');

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

const startTutorSession = async (req, res) => {
    if (!ai) return res.status(400).json({ error: 'AI features are not configured.' });
    
    const { questId, userId } = req.body;
    if (!questId || !userId) return res.status(400).json({ error: 'questId and userId are required.' });

    const quest = await dataSource.getRepository(QuestEntity).findOneBy({ id: questId });
    const user = await dataSource.getRepository(UserEntity).findOneBy({ id: userId });
    const tutor = await dataSource.getRepository(AITutorEntity).findOneBy({ id: quest.aiTutorId });

    if (!quest || !user || !tutor) return res.status(404).json({ error: 'Required data not found.' });

    const quizGenerationPrompt = `You are an AI Teacher creating a short, 3-question multiple-choice quiz to assess baseline knowledge on the subject of "${tutor.subject}". The user is ${tutor.targetAgeGroup}. Use these sample questions as inspiration for the difficulty and topic: ${tutor.sampleQuestions.join(', ')}. Each question must have exactly 4 choices, with only one being correct. The last choice for every question must be "I don't know", and it is never the correct answer.`;

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
                                type: Type.OBJECT, properties: { text: { type: Type.STRING }, isCorrect: { type: Type.BOOLEAN } }, required: ['text', 'isCorrect']
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
    
    let personaInstruction = '';
    switch(tutor.style) {
        case 'Encouraging Coach': personaInstruction = 'You are an encouraging and positive coach. Use sports analogies and praise effort.'; break;
        case 'Socratic Questioner': personaInstruction = 'You primarily teach by asking thought-provoking questions to guide the user to the answer.'; break;
        case 'Direct Teacher': personaInstruction = 'You are a straightforward and clear teacher. You present facts directly and concisely.'; break;
        case 'Custom': personaInstruction = tutor.customPersona || 'You are a helpful AI Tutor.'; break;
    }

    const generalInstructionText = tutor.generalInstructions ? `\n**General Instructions to always follow:** ${tutor.generalInstructions}` : '';

    const systemInstruction = `You are an AI Tutor named ${tutor.name}. Your subject is ${tutor.subject}.
    ${personaInstruction}
    ${generalInstructionText}
    You are tutoring a user named ${user.gameName} who is in the ${tutor.targetAgeGroup} age group.

    **Core Interaction Loop:**
    1.  **Analyze User's Answer:** I will provide the user's answer to your previous question.
    2.  **Provide Feedback & Teach:** Your text response MUST provide feedback on the user's answer. If correct, praise them. If incorrect, explain the concept gently. Then, introduce the next small piece of information (1-3 sentences).
    3.  **Ask a Question:** After your text response, you MUST use the "ask_a_question_with_choices" function to present the next multiple choice question. Do not ask multiple-choice questions in plain text or inside a code block.

    **Special Instructions:**
    - If you receive the system message '[USER_INACTIVE]', you MUST respond ONLY with a gentle, encouraging prompt like "Are you still there?", "Need a hint?", or "Let me know if you're stuck!". Do NOT teach or ask a new question in response to this system message.
    - When you receive the final quiz results, your final message MUST be a concise, bulleted summary of the key takeaways from the lesson.
    - **CRITICAL:** ALWAYS use the 'ask_a_question_with_choices' tool for all multiple-choice questions. Do not output it as text or inside a <tool_code> block.
    `;
    
    const chat = await ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
        tools: [askAQuestionWithChoicesTool]
    });

    const sessionId = `tutor-session-${Date.now()}`;
    activeChats.set(sessionId, chat);
    setTimeout(() => activeChats.delete(sessionId), 60 * 60 * 1000); // 1-hour expiry

    res.status(201).json({ sessionId, quiz });
};

const sendMessageToTutor = async (req, res) => {
    if (!ai) return res.status(400).json({ error: 'AI features are not configured.' });
    
    const { sessionId, message } = req.body;
    const chat = activeChats.get(sessionId);
    if (!chat) return res.status(404).json({ error: 'Chat session not found or expired.' });

    try {
        const response = await chat.sendMessage({ message });
        const parts = response.candidates[0].content.parts;
        let textPart = parts.find(part => part.text);
        let functionCallPart = parts.find(part => part.functionCall);

        res.json({
            reply: textPart?.text || '',
            functionCall: functionCallPart || null,
        });
    } catch (error) {
        console.error("Gemini Tutor Chat Error:", error);
        res.status(500).json({ error: 'Failed to get a response from the AI Tutor.' });
    }
};

const generateFinalQuiz = async (req, res) => {
    if (!ai) return res.status(400).json({ error: 'AI features are not configured.' });
    
    const { sessionId } = req.body;
    const chat = activeChats.get(sessionId);
    if (!chat) return res.status(404).json({ error: 'Chat session not found or expired.' });

    try {
        const history = await chat.getHistory();
        const conversationText = history.map(h => `${h.role}: ${h.parts.map(p => p.text).join(' ')}`).join('\n');
        
        const prompt = `Based on the preceding conversation history, generate a 3-question multiple-choice quiz to test the user's understanding. Each question must have 4 choices, with only one being correct. The last choice for every question must be "I don't know", which is never correct.\n\nConversation History:\n${conversationText}`;

        const quizSchema = {
             type: Type.OBJECT,
            properties: {
                questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            choices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, isCorrect: { type: Type.BOOLEAN } } } }
                        },
                    }
                }
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: quizSchema }
        });

        res.json({ quiz: JSON.parse(response.text) });
    } catch (error) {
        console.error("Gemini Final Quiz Error:", error);
        res.status(500).json({ error: 'Failed to generate a final quiz.' });
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
    startTutorSession: asyncMiddleware(startTutorSession),
    sendMessageToTutor: asyncMiddleware(sendMessageToTutor),
    generateFinalQuiz: asyncMiddleware(generateFinalQuiz),
    generateStory: asyncMiddleware(generateStory),
    isAiConfigured: () => !!ai,
};