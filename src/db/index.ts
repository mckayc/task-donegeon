
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import path from 'path';
import fs from 'fs';

// Use environment variable for data path, or default to ./data
const dataPath = process.env.APP_DATA_PATH || './data';

// Ensure the data directory exists
if (!fs.existsSync(dataPath)) {
    console.log(`Data directory not found. Creating at: ${dataPath}`);
    fs.mkdirSync(dataPath, { recursive: true });
}

const dbPath = path.join(dataPath, 'app.db');
console.log(`Connecting to database at: ${dbPath}`);

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL'); // Recommended for performance

export const db = drizzle(sqlite, { schema, logger: false }); // Set logger to true for debugging
