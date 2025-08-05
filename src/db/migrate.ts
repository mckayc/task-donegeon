
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index.ts';

console.log('Running database migrations...');

try {
  // This will run migrations on the database, skipping the ones already applied
  migrate(db, { migrationsFolder: 'drizzle' });
  
  console.log('Migrations applied successfully.');
  process.exit(0);
} catch (error) {
  console.error('Error running migrations:', error);
  process.exit(1);
}
