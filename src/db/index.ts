
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import path from 'path';
import fs from 'fs';

// Function to initialize the database
const initializeDatabase = () => {
    try {
        // Use environment variable for data path, or default to ./data
        const dataPath = process.env.APP_DATA_PATH || './data';

        // Ensure the data directory exists
        if (!fs.existsSync(dataPath)) {
            console.log(`Data directory not found. Creating at: ${dataPath}`);
            fs.mkdirSync(dataPath, { recursive: true });
        }

        const dbPath = path.join(dataPath, 'app.db');
        console.log(`Attempting to connect to database at: ${dbPath}`);

        // Add verbose logging to the connection itself for more detailed startup info
        const sqlite = new Database(dbPath, { verbose: console.log });
        sqlite.pragma('journal_mode = WAL'); // Recommended for performance

        return drizzle(sqlite, { schema, logger: false }); // Set Drizzle's logger to true for detailed query debugging if needed
    } catch (error) {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("!!!   DATABASE CONNECTION FAILED     !!!");
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("An error occurred during database initialization:");
        console.error(error);
        throw error; // Rethrowing will exit the process because this is called at the top level
    }
};

export const db = initializeDatabase();
