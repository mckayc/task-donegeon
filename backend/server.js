
require("reflect-metadata");
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { dataSource, ensureDatabaseDirectoryExists } = require('./data-source');
const { GuildEntity, UserEntity, MarketEntity, TrophyEntity, MinigameEntity, RewardTypeDefinitionEntity } = require('./entities');
const { updateTimestamps } = require('./utils/helpers');
const { In } = require('typeorm');
const { INITIAL_TROPHIES, INITIAL_REWARD_TYPES } = require('./initialData');

// --- Routers ---
const questsRouter = require('./routes/quests.routes');
const usersRouter = require('./routes/users.routes');
const marketsRouter = require('./routes/markets.routes');
const rewardsRouter = require('./routes/rewards.routes');
const ranksRouter = require('./routes/ranks.routes');
const trophiesRouter = require('./routes/trophies.routes');
const assetsRouter = require('./routes/assets.routes');
const questGroupsRouter = require('./routes/questGroups.routes');
const themesRouter = require('./routes/themes.routes');
const eventsRouter = require('./routes/events.routes');
const rotationsRouter = require('./routes/rotations.routes');
const appliedModifiersRouter = require('./routes/appliedModifiers.routes');
const tradesRouter = require('./routes/trades.routes');
const giftsRouter = require('./routes/gifts.routes');
const guildsRouter = require('./routes/guilds.routes');
const settingsRouter = require('./routes/settings.routes');
const chatRouter = require('./routes/chat.routes');
const bugReportsRouter = require('./routes/bugReports.routes');
const notificationsRouter = require('./routes/notifications.routes');
const setbacksRouter = require('./routes/setbacks.routes');
const minigamesRouter = require('./routes/minigames.routes');
// --- NEW MODULAR ROUTERS ---
const dataRouter = require('./routes/data.routes');
const managementRouters = require('./routes/management.routes');
const aiRouter = require('./routes/ai.routes');
const systemRouter = require('./routes/system.routes');
const chroniclesRouter = require('./routes/chronicles.routes');


const app = express();
const port = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// === Server-Side Activity Logging Setup ===
const loggedUsers = new Map(); // In-memory store for user IDs and their logging expiry timestamps.

// Middleware to attach the logger store to each request
app.use((req, res, next) => {
    req.loggedUsers = loggedUsers;
    next();
});

const activityLogMiddleware = (req, res, next) => {
    // This middleware will log requests for specific users if their logging session is active.
    // It relies on the body being parsed, so it should run after express.json().
    // We try to find the user ID from various common places in the request.
    const userId = req.body?.userId || req.query?.userId || req.params?.userId || req.body?.senderId || (req.body?.user?.id) || (req.body?.adminUserData?.id);
    
    if (userId && req.loggedUsers.has(userId)) {
        const expiry = req.loggedUsers.get(userId);
        if (Date.now() < expiry) {
            // Log the activity
            console.log(`[Activity Log] User: ${userId} | ${req.method} ${req.originalUrl} | Body: ${JSON.stringify(req.body)}`);
        } else {
            // Clean up expired session
            req.loggedUsers.delete(userId);
            console.log(`[Activity Log] Logging session expired for user ${userId}.`);
        }
    }
    next();
};

// Apply the logging middleware to all API routes
app.use('/api', activityLogMiddleware);


// === Backup/Asset Directories & Scheduler ===
const DATA_ROOT = path.resolve(__dirname, '..', 'data');
const UPLOADS_DIR = path.resolve(DATA_ROOT, 'assets');
const MEDIA_DIR = process.env.CONTAINER_MEDIA_PATH || '/app/media';
const BACKUP_DIR = path.resolve(DATA_ROOT, 'backups');
const ASSET_PACKS_DIR = path.resolve(DATA_ROOT, 'asset_packs');
const DEFAULT_ASSET_PACKS_SOURCE_DIR = path.join(__dirname, 'default_asset_packs');

const { runScheduledBackups, runScheduledRotations } = require('./controllers/management.controller');
const startAutomatedBackupScheduler = () => {
    setInterval(runScheduledBackups, 3600000); // Check every hour
    setTimeout(runScheduledBackups, 10000); // Also run 10s after start
};

const startAutomatedRotationScheduler = () => {
    // Run every 15 minutes to check for due rotations
    setInterval(runScheduledRotations, 15 * 60 * 1000);
    // Also run shortly after server start for immediate assignment if needed
    setTimeout(runScheduledRotations, 15000);
};

const ensureDefaultAssetPacksExist = async () => {
    try {
        await fs.mkdir(ASSET_PACKS_DIR, { recursive: true });
        const defaultPacks = await fs.readdir(DEFAULT_ASSET_PACKS_SOURCE_DIR);
        for (const packFilename of defaultPacks) {
            const sourcePath = path.join(DEFAULT_ASSET_PACKS_SOURCE_DIR, packFilename);
            const destPath = path.join(ASSET_PACKS_DIR, packFilename);
            await fs.copyFile(sourcePath, destPath);
            console.log(`Synced default asset pack: ${packFilename}`);
        }
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore if the default packs dir doesn't exist
            console.error('Could not ensure default asset packs exist:', error);
        }
    }
};


// === Database Initialization and Server Start ===
const initializeApp = async () => {
    await ensureDatabaseDirectoryExists();
    await dataSource.initialize();
    console.log("Data Source has been initialized!");

    const manager = dataSource.manager;

    // MIGRATION/SYNC: Ensure a default guild exists and all users are members.
    let defaultGuild = await manager.findOne(GuildEntity, { where: { isDefault: true }, relations: ['members'] });
    if (!defaultGuild) {
        console.log('[Data Sync] No default guild found. Creating one...');
        defaultGuild = manager.create(GuildEntity, {
            id: 'guild-default',
            name: "Adventurer's Guild",
            purpose: 'The main guild for all adventurers.',
            isDefault: true,
            treasury: { purse: {}, ownedAssetIds: [] },
            members: [],
        });
        await manager.save(updateTimestamps(defaultGuild, true));
        console.log('[Data Sync] Default guild created.');
    }
    
    const allUsers = await manager.find(UserEntity);
    const guildMemberIds = new Set(defaultGuild.members.map(m => m.id));
    let needsSave = false;
    allUsers.forEach(user => {
        if (!guildMemberIds.has(user.id)) {
            console.log(`[Data Sync] Adding user "${user.gameName}" (${user.id}) to default guild.`);
            defaultGuild.members.push(user);
            needsSave = true;
        }
    });
    if (needsSave) {
        await manager.save(updateTimestamps(defaultGuild));
        console.log(`[Data Sync] Default guild membership updated.`);
    }

    // MIGRATION/SYNC: Ensure a default exchange market exists.
    let defaultMarket = await manager.findOne(MarketEntity, { where: { id: 'market-bank' } });
    if (!defaultMarket) {
        console.log('[Data Sync] No default market found. Creating one...');
        defaultMarket = manager.create(MarketEntity, {
            id: 'market-bank',
            title: "Exchange Post",
            description: "Exchange your various currencies and experience points.",
            iconType: 'emoji',
            icon: '⚖️',
            status: { type: 'open' },
        });
        await manager.save(updateTimestamps(defaultMarket, true));
        console.log('[Data Sync] Default market created.');
    }
    
    // MIGRATION/SYNC: Ensure The Arcade market exists.
    let arcadeMarket = await manager.findOne(MarketEntity, { where: { id: 'market-arcade' } });
    if (!arcadeMarket) {
        console.log('[Data Sync] Arcade market not found. Creating it...');
        arcadeMarket = manager.create(MarketEntity, {
            id: 'market-arcade',
            title: "The Arcade",
            description: "Spend your Game Tokens to play fun minigames and compete for high scores!",
            iconType: 'emoji',
            icon: '🕹️',
            status: { type: 'open' },
        });
        await manager.save(updateTimestamps(arcadeMarket, true));
        console.log('[Data Sync] The Arcade created.');
    }

    // MIGRATION/SYNC: Ensure the Snake minigame exists.
    let snakeGame = await manager.findOne(MinigameEntity, { where: { id: 'minigame-snake' } });
    if (!snakeGame) {
        console.log('[Data Sync] Snake game not found. Creating it...');
        snakeGame = manager.create(MinigameEntity, {
            id: 'minigame-snake',
            name: 'Snake',
            description: 'The classic game of snake. Eat the food to grow longer, but don\'t run into yourself or the walls!',
            icon: '🐍',
            cost: 1, // Costs 1 Game Token
        });
        await manager.save(updateTimestamps(snakeGame, true));
        console.log('[Data Sync] Snake game created.');
    }

    // MIGRATION/SYNC: Add new minigames if they don't exist
    const newMinigames = [
        { id: 'minigame-dragons-dice', name: "Dragon's Dice", description: "A classic dice game of risk and reward. Roll the dice, bank points, but don't get greedy or you'll lose it all!", icon: '🎲', cost: 1 },
        { id: 'minigame-rune-breaker', name: 'Rune Breaker', description: 'A fantasy-themed version of the classic Breakout. Control a magical shield and bounce an orb to break rows of enchanted runes.', icon: '🛡️', cost: 1 },
        { id: 'minigame-dungeon-dash', name: 'Dungeon Dash', description: 'A simple side-scrolling "endless runner." An adventurer runs automatically, and the player taps to make them jump over pits and slide under obstacles.', icon: '🏃‍♂️', cost: 1 },
        { id: 'minigame-forge-master', name: 'Forge Master', description: 'A rhythm and timing game. The player must click or tap at the right moment to strike a piece of hot metal with a hammer, following a moving bar on the screen.', icon: '🔨', cost: 1 },
        { id: 'minigame-archers-folly', name: "Archer's Folly", description: 'An archery game where the player clicks and drags to aim their bow. They must hit a series of moving targets, accounting for arrow drop over distance.', icon: '🏹', cost: 1 },
        { id: 'minigame-tetris', name: 'Tetris', description: 'The classic block-stacking puzzle game. Clear lines to score points!', icon: '🧱', cost: 1 },
    ];

    for (const gameData of newMinigames) {
        let game = await manager.findOne(MinigameEntity, { where: { id: gameData.id } });
        if (!game) {
            console.log(`[Data Sync] ${gameData.name} game not found. Creating it...`);
            game = manager.create(MinigameEntity, gameData);
            await manager.save(updateTimestamps(game, true));
            console.log(`[Data Sync] ${gameData.name} game created.`);
        }
    }


    // MIGRATION/SYNC: Add birthday trophies if they don't exist
    const trophyRepo = manager.getRepository(TrophyEntity);
    const birthdayTrophyIds = INITIAL_TROPHIES.filter(t => t.id.startsWith('trophy-bday-')).map(t => t.id);
    if (birthdayTrophyIds.length > 0) {
        const existingBdayTrophies = await trophyRepo.findBy({ id: In(birthdayTrophyIds) });
        const existingBdayTrophyIds = new Set(existingBdayTrophies.map(t => t.id));
        const trophiesToAdd = INITIAL_TROPHIES.filter(t => t.id.startsWith('trophy-bday-') && !existingBdayTrophyIds.has(t.id));

        if (trophiesToAdd.length > 0) {
            console.log(`[Data Sync] Found ${trophiesToAdd.length} missing birthday trophies. Adding them now...`);
            await trophyRepo.save(trophiesToAdd.map(t => updateTimestamps(t, true)));
            console.log('[Data Sync] Birthday trophies added.');
        }
    }

    // MIGRATION/SYNC: Ensure core Game Token reward type exists.
    const rewardTypeRepo = manager.getRepository(RewardTypeDefinitionEntity);
    const gameTokenReward = await rewardTypeRepo.findOneBy({ id: 'core-token' });
    if (!gameTokenReward) {
        console.log('[Data Sync] Game Token reward type not found. Creating it...');
        const gameTokenData = INITIAL_REWARD_TYPES.find(rt => rt.id === 'core-token');
        if (gameTokenData) {
            const newGameToken = rewardTypeRepo.create(gameTokenData);
            await rewardTypeRepo.save(updateTimestamps(newGameToken, true));
            console.log('[Data Sync] Game Token reward type created.');
        }
    }


    // Ensure asset and backup directories exist
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    // This will check/create the MEDIA_DIR if it doesn't exist, which is good practice.
    await fs.mkdir(MEDIA_DIR, { recursive: true });
    await ensureDefaultAssetPacksExist();
    
    // Start schedulers
    startAutomatedBackupScheduler();
    startAutomatedRotationScheduler();

    console.log("Application initialization complete.");
};

// === API Routes ===
app.use('/api/quests', questsRouter);
app.use('/api/users', usersRouter);
app.use('/api/markets', marketsRouter);
app.use('/api/reward-types', rewardsRouter);
app.use('/api/ranks', ranksRouter);
app.use('/api/trophies', trophiesRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/quest-groups', questGroupsRouter);
app.use('/api/themes', themesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/rotations', rotationsRouter);
app.use('/api/applied-modifiers', appliedModifiersRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/gifts', giftsRouter);
app.use('/api/guilds', guildsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/bug-reports', bugReportsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/setbacks', setbacksRouter);
app.use('/api/minigames', minigamesRouter);
// Modular routers
app.use('/api/data', dataRouter);
app.use('/api/system', systemRouter);
app.use('/api/chronicles', chroniclesRouter);
app.use('/api/ai', aiRouter);
// Management routers from the management.routes.js file
app.use('/api/asset-packs', managementRouters.assetPacksRouter);
app.use('/api/image-packs', managementRouters.imagePacksRouter);
app.use('/api/backups', managementRouters.backupsRouter);
app.use('/api/media', managementRouters.mediaRouter);

// === Static File Serving ===
// Serve static assets from the 'dist' directory (frontend build output)
app.use(express.static(path.join(__dirname, '..', 'dist')));
// Serve uploaded assets from the 'data/assets' directory
app.use('/uploads', express.static(UPLOADS_DIR));
// Serve media files from the user-configurable 'data/media' directory
app.use('/media', express.static(MEDIA_DIR));

// === Catch-all for Frontend Routing ===
// For any other request, serve the index.html file to let the React router handle it.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});


// === Start the server after initialization ===
initializeApp().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}).catch(error => {
    console.error("Failed to initialize application:", error);
    process.exit(1);
});