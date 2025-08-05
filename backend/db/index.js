const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');

const dbDir = path.join(__dirname);
const dbPath = path.join(dbDir, 'app.db');

// Ensure the directory exists. This is crucial for environments where the volume is mapped.
fs.mkdirSync(dbDir, { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL'); // Recommended for better performance and concurrency

const db = drizzle(sqlite);

// Run migrations
try {
    migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
    console.log("Migrations ran successfully.");
} catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
}


module.exports = { db };
