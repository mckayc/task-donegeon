-- Version 1: Initial Schema
-- Establishes the core tables for the application.

-- Main data table to store the entire application state as a single JSON object.
-- This follows the original design and ensures backward compatibility with existing data.
CREATE TABLE IF NOT EXISTS data (
    id INTEGER PRIMARY KEY,
    json TEXT NOT NULL
);

-- Ensures only one row can exist in the data table.
-- All application data is managed within the JSON of this single row.
INSERT OR IGNORE INTO data (id, json) VALUES (1, '{}');

-- Table to track the current version of the database schema.
-- This is essential for the migration system to work correctly.
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL
);

-- Sets the initial version of the schema to 1.
INSERT OR IGNORE INTO schema_version (version) VALUES (1);