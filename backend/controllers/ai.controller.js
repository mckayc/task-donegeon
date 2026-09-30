

const { GoogleGenAI, Type } = require('@google/genai');
const { asyncMiddleware } = require('../utils/helpers');
const { dataSource } = require('../data-source');
const { QuestEntity, UserEntity, AITutorEntity } = require('../entities');

let ai;
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (apiKey && apiKey !== 'thiswontworkatall') {
    ai = new GoogleGenAI({ apiKey });
} else {
    console.warn("WARNING: GEMINI_API_KEY or API_KEY environment variable not set or is default. AI features will be disabled.");
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

const suggestHolidays = async (req, res) => {
    if (!ai) {
        return res.status(400).json({ error: 'AI features are not configured on the server.' });
    }
    const { region = 'USA' } = req.body;
    const prompt = `List the next 5 major public holidays in the ${region} starting from today, ${new Date().toISOString().split('T')[0]}. For each holiday, provide its name and date in YYYY-MM-DD format.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        holidays: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format.' }
                                },
                                required: ['name', 'date']
                            }
                        }
                    },
                    required: ['holidays']
                }
            }
        });

        const holidayData = JSON.parse(response.text);
        res.json(holidayData);
    } catch (error) {
        console.error("Gemini Holiday Suggestion Error:", error);
        res.status(500).json({ error: 'Failed to generate holiday suggestions.' });
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

    **Your Turn Structure:**
    Your response on every turn MUST consist of two parts in this exact order:
    1.  **Teaching Text (the text part):** A conversational response. Provide feedback on the user's previous answer and teach the next small concept. This part MUST NOT ask a multiple-choice question.
    2.  **Question (the tool call part):** Immediately after the text, you MUST call the "ask_a_question_with_choices" tool to ask the next multiple-choice question. This is the ONLY way you are allowed to ask questions with choices.

    **Example Turn:**
    User's answer: "Photosynthesis"
    Your 'text' response would be: "That's exactly right! Photosynthesis is how plants make their food. Now, let's look at what they need to do it."
    Your 'tool_code' response would be: print(ask_a_question_with_choices(question='What is the most important ingredient for photosynthesis?', choices=['Sunlight', 'Water', 'Soil', 'Moonlight']))

    **Exceptions to the two-part structure:**
    - If I send you the system message '[USER_INACTIVE]', you MUST respond ONLY with a short, encouraging text response (e.g., "Are you still there?"). Do NOT call the tool.
    - When I send you the final quiz results, you MUST respond ONLY with a text summary of the lesson. Do NOT call the tool.

    Begin the lesson now based on the user's pre-quiz results.
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

const planArchitect = async (req, res) => {
    if (!ai) {
        return res.status(400).json({ error: 'AI features are not configured on the server. Please check your Gemini API key.' });
    }

    const {
        goal,
        purpose,
        children = [],
        style = 'balanced',
        availableRewardTypes = [],
        refinementInstructions = '',
        existingPlan = null
    } = req.body;

    if (!goal || !goal.trim()) {
        return res.status(400).json({ error: 'A goal description is required.' });
    }

    const rewardNames = availableRewardTypes.length > 0
        ? availableRewardTypes.map(r => r.name).join(', ')
        : 'Gold, Experience (XP)';

    const childrenInfo = children.length > 0
        ? children.map(c => `- ${c.name} (${c.age ? `Age ${c.age}` : 'Age unspecified'}${c.aboutMe ? `, Interests: ${c.aboutMe}` : ''})`).join('\n')
        : 'Family kids / explorers (general ages 6-13)';

    let prompt = `You are "The Quest Architect", an expert family behavioral strategist and game designer for a gamified task app called "Task Donegeon".
A parent is seeking your assistance to create a structured plan of quests, duties, and incentives for their children.

PARENT'S INPUT:
- Goal (What they want their kids to do): "${goal}"
- Purpose & Why (Why this matters to the family): "${purpose || 'Build consistency, independence, and positive habits'}"
- Target Children:
${childrenInfo}
- Strategy Tone Preference: ${style} (e.g. habit_builder = gentle progressive steps; epic_adventure = RPG lore and ranks; speed_efficiency = sprint timers; balanced = well-rounded mix)
- Available Economy Reward Types: ${rewardNames}

CRITICAL RULES:
1. Provide exactly TWO distinct plans (Plan A and Plan B) offering contrasting, realistic approaches to solving the parent's goal (e.g., one could be a Collaborative Co-Op split between the children, and the other could be a Progressive Milestone Arc).
2. Each plan should have 2 to 4 actionable Quests (Duties for recurring habits, or Ventures for one-time/weekend projects).
3. For each quest, provide 2 to 4 micro-checkpoints (concrete bite-sized steps that prevent kids from feeling overwhelmed).
4. Assign rewards responsibly: reward amounts MUST be small integers between 1 and 5 (e.g. 2 Gold, 10 XP).
5. If the parent specified a time (morning, evening, etc.), set timeOfDay accordingly.
6. Provide an optional suggested privilege that unlocks when kids stick to the plan (e.g. 45 min game time or weekend treat).`;

    if (refinementInstructions && existingPlan) {
        prompt += `\n\nUSER REFINEMENT REQUEST:
The user previously reviewed this plan:
"${existingPlan.title}: ${existingPlan.philosophy}"
The user wants you to modify and adapt the plan with these specific instructions:
"${refinementInstructions}"
Please incorporate their feedback into both updated plans.`;
    }

    const planSchema = {
        type: Type.OBJECT,
        properties: {
            plans: {
                type: Type.ARRAY,
                description: 'Exactly 2 distinct strategic plans',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING, description: 'plan-a or plan-b' },
                        title: { type: Type.STRING, description: 'Catchy, creative title for this plan' },
                        strategyStyle: { type: Type.STRING, description: 'Short strategy style label (e.g. "Collaborative Co-Op", "Progressive Habit Ladder")' },
                        philosophy: { type: Type.STRING, description: '2-3 sentences explaining why this strategy fulfills the parent purpose and avoids chore friction' },
                        gamificationHook: { type: Type.STRING, description: 'How motivation is maintained (e.g. streaks, team badge, leveling up)' },
                        suggestedGroupName: { type: Type.STRING, description: 'Suggested Quest Group name (e.g. "🐾 Canine Companionship Arc")' },
                        suggestedPrivilege: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: 'Reward privilege name' },
                                description: { type: Type.STRING, description: 'When and how this privilege is enjoyed' },
                                icon: { type: Type.STRING, description: 'Single emoji' },
                                type: { type: Type.STRING, description: 'timer or unlock_only' },
                                durationMinutes: { type: Type.INTEGER, description: 'Duration in minutes if timer type' },
                                minDutyPercentage: { type: Type.INTEGER, description: 'Required completion percentage (e.g. 100)' }
                            },
                            required: ['title', 'icon', 'type']
                        },
                        quests: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING, description: 'Quest title' },
                                    description: { type: Type.STRING, description: 'One or two sentence encouraging description' },
                                    icon: { type: Type.STRING, description: 'Single relevant emoji' },
                                    type: { type: Type.STRING, description: 'Duty (recurring) or Venture (one-off/project)' },
                                    timeOfDay: { type: Type.STRING, description: 'any, morning, afternoon, or evening' },
                                    timerMode: { type: Type.STRING, description: 'none, countdown, or stopwatch' },
                                    timerDurationSeconds: { type: Type.INTEGER, description: 'Timer duration in seconds (e.g. 600 for 10m)' },
                                    checkpoints: {
                                        type: Type.ARRAY,
                                        description: '2 to 4 micro-steps for the child to check off',
                                        items: { type: Type.STRING }
                                    },
                                    suggestedRewardTypeName: { type: Type.STRING, description: 'Name of the reward type from available list' },
                                    suggestedRewardAmount: { type: Type.INTEGER, description: 'Integer between 1 and 5' },
                                    suggestedChildName: { type: Type.STRING, description: 'Target child name or All' }
                                },
                                required: ['title', 'description', 'icon', 'type', 'checkpoints', 'suggestedRewardTypeName', 'suggestedRewardAmount']
                            }
                        }
                    },
                    required: ['id', 'title', 'strategyStyle', 'philosophy', 'gamificationHook', 'suggestedGroupName', 'quests']
                }
            }
        },
        required: ['plans']
    };

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: planSchema,
                    temperature: 0.7,
                }
            });

            const parsed = JSON.parse(response.text);
            return res.json(parsed);
        } catch (err) {
            console.warn(`Gemini Plan Architect attempt with ${modelName} failed:`, err.message);
            lastError = err;
        }
    }

    console.error("All Gemini model attempts failed for Plan Architect:", lastError);
    let userMsg = 'Failed to generate strategic quest plans. Please try again.';
    if (lastError && lastError.message) {
        try {
            const parsed = JSON.parse(lastError.message);
            if (parsed.error && parsed.error.message) {
                userMsg = parsed.error.message;
            }
        } catch (_) {
            userMsg = lastError.message;
        }
    }
    res.status(500).json({ error: userMsg });
};

module.exports = {
    testApiKey: asyncMiddleware(testApiKey),
    generateContent: asyncMiddleware(generateContent),
    startTutorSession: asyncMiddleware(startTutorSession),
    sendMessageToTutor: asyncMiddleware(sendMessageToTutor),
    generateFinalQuiz: asyncMiddleware(generateFinalQuiz),
    generateStory: asyncMiddleware(generateStory),
    suggestHolidays: asyncMiddleware(suggestHolidays),
    planArchitect: asyncMiddleware(planArchitect),
    isAiConfigured: () => !!ai,
};