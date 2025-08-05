

import { DataSource } from 'typeorm';
import { User } from './entities/User.js';
import { Quest } from './entities/Quest.js';
import { QuestGroup } from './entities/QuestGroup.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { cp } from 'fs/promises';

// --- Path Configuration ---
// Recreate __dirname for ES Modules to locate source files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define a single root for all user-managed data.
// This can be mounted via a Docker volume to persist data.
// Default is /app/data inside the container.
const dataRoot = process.env.APP_DATA_PATH || '/app/data';

// Define specific subdirectories for different data types
export const databaseDirectory = path.join(dataRoot, 'database');
export const assetsDirectory = path.join(dataRoot, 'assets');
const dbPath = path.join(databaseDirectory, 'task-donegeon.sqlite');

// --- Directory and Asset Initialization ---

// Ensure the data directories exist.
if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory, { recursive: true });
}
if (!fs.existsSync(assetsDirectory)) {
    fs.mkdirSync(assetsDirectory, { recursive: true });
}

// On first run, copy the default assets from the source code to the user-managed assets directory.
// This makes the default packs visible and manageable through the user's Docker volume.
try {
    const assetFiles = fs.readdirSync(assetsDirectory);
    if (assetFiles.length === 0) {
        const sourceAssetsDir = path.join(__dirname, '..', 'assets');
        console.log(`Assets directory is empty. Copying default assets from ${sourceAssetsDir} to ${assetsDirectory}...`);
        cp(sourceAssetsDir, assetsDirectory, { recursive: true })
            .then(() => console.log('Default assets copied successfully.'))
            .catch(err => console.error('Error copying default assets:', err));
    }
} catch (error) {
    console.error('Failed to check or copy assets:', error);
}

// --- TypeORM DataSource Configuration ---
export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  /**
   * Automatically creates the database schema on every application launch.
   * This is ideal for development but might be too aggressive for production.
   * For production, consider using migrations (`synchronize: false`).
   */
  synchronize: true, 
  logging: false,
  entities: [User, Quest, QuestGroup],
  subscribers: [],
  migrations: [],
});