const { DataSource } = require("typeorm");
const path = require('path');
const { allEntities } = require('./entities');
const fs = require('fs').promises;

const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, '..', 'data', 'database', 'database.sqlite');
const dbDir = path.dirname(dbPath);

// Function to ensure directory exists
const ensureDatabaseDirectoryExists = async () => {
    try {
        await fs.mkdir(dbDir, { recursive: true });
    } catch (error) {
        console.error("Could not create database directory:", error);
        process.exit(1);
    }
};

const dataSource = new DataSource({
    type: "sqlite",
    database: dbPath,
    entities: allEntities,
    synchronize: true, // Automatically creates/updates schema based on entities.
    logging: false, 
});

module.exports = { dataSource, ensureDatabaseDirectoryExists };