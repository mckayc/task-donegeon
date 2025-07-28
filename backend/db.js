
const { Pool } = require('pg');

let pool;
try {
    console.log("Attempting to create PostgreSQL pool...");
    let sslConfig;
    if (process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('sslmode=require'))) {
        sslConfig = { rejectUnauthorized: false };
    }

    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: sslConfig,
    });
    console.log("PostgreSQL pool created successfully.");

    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });
} catch (error) {
    console.error("Failed to create PostgreSQL pool:", error);
}

const initializeDb = async () => {
    if (!pool) {
        console.error("Database pool is not available. Skipping DB initialization.");
        return;
    }
    try {
        console.log("Initializing database... Checking for app_data table.");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_data (
                key TEXT PRIMARY KEY,
                value JSONB NOT NULL
            );
        `);
        console.log("Table check complete. Verifying initial data.");
        const res = await pool.query("SELECT value FROM app_data WHERE key = 'appState'");
        if (res.rows.length === 0) {
            console.log("No existing data found. Seeding database with guided setup...");
            const { 
                createMockUsers, 
                INITIAL_REWARD_TYPES, 
                INITIAL_RANKS, 
                INITIAL_TROPHIES, 
                createSampleMarkets, 
                createSampleQuests, 
                createInitialGuilds, 
                createSampleGameAssets, 
                INITIAL_THEMES,
                INITIAL_QUEST_GROUPS,
                INITIAL_SETTINGS
            } = require('./initialData');

            const mockUsers = createMockUsers();
            const initialData = {
                users: mockUsers,
                quests: createSampleQuests(mockUsers),
                questGroups: INITIAL_QUEST_GROUPS,
                markets: createSampleMarkets(),
                rewardTypes: INITIAL_REWARD_TYPES,
                questCompletions: [],
                purchaseRequests: [],
                guilds: createInitialGuilds(mockUsers),
                ranks: INITIAL_RANKS,
                trophies: INITIAL_TROPHIES,
                userTrophies: [],
                adminAdjustments: [],
                gameAssets: createSampleGameAssets(),
                systemLogs: [],
                settings: { ...INITIAL_SETTINGS, contentVersion: 2 },
                themes: INITIAL_THEMES,
                loginHistory: [],
                chatMessages: [],
                systemNotifications: [],
                scheduledEvents: [],
            };
            await pool.query("INSERT INTO app_data (key, value) VALUES ('appState', $1)", [JSON.stringify(initialData)]);
            console.log("Database seeded with initial guided setup.");
        } else {
             console.log("Existing data found. Initialization complete.");
        }
    } catch (error) {
        console.error("Error initializing database:", error);
    }
};

const saveData = async (data) => {
    if (!pool) throw new Error("Database not connected.");
    await pool.query(
        "INSERT INTO app_data (key, value) VALUES ('appState', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
        [JSON.stringify(data)]
    );
};

const loadData = async () => {
    if (!pool) throw new Error("Database not connected.");
    const res = await pool.query("SELECT value FROM app_data WHERE key = 'appState'");
    if (res.rows.length === 0) {
        console.warn("No data found in loadData, attempting to re-initialize...");
        await initializeDb(); // Attempt to initialize if it failed on start
        const secondAttempt = await pool.query("SELECT value FROM app_data WHERE key = 'appState'");
        if (secondAttempt.rows.length === 0) throw new Error("No data found in database after re-initialization attempt.");
        return secondAttempt.rows[0].value;
    }
    return res.rows[0].value;
};


module.exports = { pool, initializeDb, saveData, loadData };
