require("reflect-metadata");
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { dataSource, ensureDatabaseDirectoryExists } = require('./data-source');
const { GuildEntity, UserEntity } = require('./entities');
const { updateTimestamps } = require('./utils/helpers');

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


// === Backup/Asset Directories & Scheduler ===
const UPLOADS_DIR = '/app/data/assets';
const BACKUP_DIR = '/app/data/backups';
const ASSET_PACKS_DIR = '/app/data/asset_packs';
const DEFAULT_ASSET_PACKS_SOURCE_DIR = path.join(__dirname, 'default_asset_packs');

const { runScheduledBackups } = require('./controllers/management.controller');
const startAutomatedBackupScheduler = () => {
    setInterval(runScheduledBackups, 3600000); // Check every hour
    setTimeout(runScheduledBackups, 10000); // Also run 10s after start
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

    // MIGRATION/SYNC: Ensure all users are in the default guild if one exists.
    const defaultGuild = await manager.findOne(GuildEntity, { where: { isDefault: true }, relations: ['members'] });
    if (defaultGuild) {
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
    }

    // Ensure asset and backup directories exist
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    await ensureDefaultAssetPacksExist();
    startAutomatedBackupScheduler();

    console.log(`Asset directory is ready at: ${UPLOADS_DIR}`);
    console.log(`Backup directory is ready at: ${BACKUP_DIR}`);
    console.log(`Asset Pack directory is ready at: ${ASSET_PACKS_DIR}`);

    app.listen(port, () => {
        console.log(`Task Donegeon backend listening at http://localhost:${port}`);
    });
};

initializeApp().catch(err => {
    console.error("Critical error during application initialization:", err);
    process.exit(1);
});

// === API ROUTES ===
app.use('/api/data', dataRouter);
app.use('/api/system', systemRouter);
app.use('/api/ai', aiRouter);
app.use('/api/chronicles', chroniclesRouter);
app.use('/api/asset-packs', managementRouters.assetPacksRouter);
app.use('/api/image-packs', managementRouters.imagePacksRouter);
app.use('/api/backups', managementRouters.backupsRouter);
app.use('/api/media', managementRouters.mediaRouter);

app.use('/api/quests', questsRouter);
app.use('/api/users', usersRouter);
app.use('/api/guilds', guildsRouter);
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
app.use('/api/settings', settingsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/bug-reports', bugReportsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/setbacks', setbacksRouter); // This is for Modifier Definitions

// Serve static assets from the 'uploads' directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});