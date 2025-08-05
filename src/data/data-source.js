
import { DataSource } from 'typeorm';
import { Task } from './entities/Task.js';
import { User } from './entities/User.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use APP_DATA_PATH from .env for the data directory, otherwise default to a 'data' folder in the project root.
const dataDir = process.env.APP_DATA_PATH || path.join(__dirname, '..', '..', 'data');

// Ensure the data directory exists.
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'task-donegeon.sqlite');

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
  entities: [Task, User],
  subscribers: [],
  migrations: [],
});