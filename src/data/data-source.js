


import { DataSource } from 'typeorm';
import { User } from './entities/User.js';
import { Quest } from './entities/Quest.js';
import { QuestGroup } from './entities/QuestGroup.js';
import path from 'path';
import fs from 'fs';

// The user's docker-compose snippet mounts a volume to `/app/data/database`.
// To ensure data is persisted correctly on that volume, we will use this as the directory for the database file.
// If the APP_DATA_PATH environment variable is set inside the container, it will be used instead,
// allowing for a configuration override.
export const databaseDirectory = process.env.APP_DATA_PATH || '/app/data/database';

// Ensure the data directory exists.
if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory, { recursive: true });
}

const dbPath = path.join(databaseDirectory, 'task-donegeon.sqlite');

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
