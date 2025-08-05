
import { DataSource } from 'typeorm';
import { User } from './entities/User';
// Import other entities as they are created
// import { Quest } from './entities/Quest.js';
// import { QuestGroup } from './entities/QuestGroup.js';
import path from 'path';
import fs from 'fs';

// --- Path Configuration ---
// In a containerized environment, data should be in a persistent volume.
// We'll default to a 'data' directory in the project root.
const dataRoot = process.env.DATA_PATH || path.resolve((process as any).cwd(), 'data');
const databaseDirectory = path.join(dataRoot, 'database');
const uploadsDirectory = path.join(dataRoot, 'uploads');
const backupsDirectory = path.join(dataRoot, 'backups');
const dbPath = path.join(databaseDirectory, 'task-donegeon.sqlite');

// --- Directory Initialization ---
try {
    console.log(`Using data root: ${dataRoot}`);
    fs.mkdirSync(databaseDirectory, { recursive: true });
    fs.mkdirSync(uploadsDirectory, { recursive: true });
    fs.mkdirSync(backupsDirectory, { recursive: true });
} catch (error) {
    console.error('Failed to create data directories:', error);
}

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  /**
   * synchronize: true automatically creates the database schema on every application launch.
   * This is great for development and for this project's requirement of starting fresh,
   * but for production with existing data, you would use `migrations` instead.
   */
  synchronize: true, 
  logging: false, // Set to true to see SQL queries in the console
  entities: [
    User,
    // Add other entities here
    // Quest,
    // QuestGroup,
  ],
  subscribers: [],
  migrations: [], // Migrations would be configured here for production
});