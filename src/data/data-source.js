
import { DataSource } from 'typeorm';
import { User } from './entities/User.js';
import { Quest } from './entities/Quest.js';
import { QuestGroup } from './entities/QuestGroup.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { cp } from 'fs/promises';

// --- Path Configuration ---
// Recreate __dirname for ES Modules to locate the source asset files for copying.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inside the container, the data root is ALWAYS /app/data.
// The user's Docker volume maps this path to a persistent location on the host.
// The application code should not know or care about the host's file system structure.
const dataRoot = '/app/data';

// Define specific subdirectories for different data types within the container's data path.
export const databaseDirectory = path.join(dataRoot, 'database');
export const assetsDirectory = path.join(dataRoot, 'assets');
export const backupsDirectory = path.join(dataRoot, 'backups');
const dbPath = path.join(databaseDirectory, 'task-donegeon.sqlite');

// --- Directory and Asset Initialization ---

// Ensure all necessary data directories exist within the data root.
// fs.mkdirSync is safe to call even if the directory already exists.
try {
    fs.mkdirSync(databaseDirectory, { recursive: true });
    fs.mkdirSync(assetsDirectory, { recursive: true });
    fs.mkdirSync(backupsDirectory, { recursive: true });
} catch (error) {
    console.error(`Failed to create data directories in ${dataRoot}:`, error);
}


// On first run (or if the assets directory is empty), copy the default assets 
// from the source code to the user-managed assets directory.
// This makes the default packs visible and manageable through the user's Docker volume.
try {
    const assetFiles = fs.readdirSync(assetsDirectory);
    if (assetFiles.length === 0) {
        // Corrected Path: Point to the 'assets' directory that was copied into 'dist' during the build process.
        // __dirname here is /app/src/data, so we go up two levels to /app, then into /dist/assets.
        const sourceAssetsDir = path.join(__dirname, '..', '..', 'dist', 'assets');
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