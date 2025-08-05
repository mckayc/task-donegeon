
import type { Config } from 'drizzle-kit';
import path from 'path';

// Read path from environment variable or use default
const dataPath = process.env.APP_DATA_PATH || './data';
const dbPath = path.join(dataPath, 'app.db');

export default {
    schema: './src/db/schema.ts',
    out: './drizzle',
    driver: 'better-sqlite',
    dbCredentials: {
        url: dbPath,
    },
    verbose: true,
    strict: true,
};
