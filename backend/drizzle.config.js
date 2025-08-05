module.exports = {
  schema: './backend/db/schema.js',
  out: './backend/db/migrations',
  dialect: 'sqlite',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: './backend/db/app.db',
  },
  verbose: true,
  strict: true,
};
