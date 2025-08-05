import { DataSource } from 'typeorm';
import { Task } from './entities/Task.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Place the database file in the project's root directory
const dbPath = path.join(__dirname, '..', '..', 'task-donegeon.sqlite');

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
  entities: [Task],
  subscribers: [],
  migrations: [],
});