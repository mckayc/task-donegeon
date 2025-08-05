
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    firstName: text('first_name'),
    lastName: text('last_name'),
    gameName: text('game_name').notNull(),
    birthday: text('birthday'),
    pin: text('pin'), // Storing PIN as text to preserve leading zeros
    password: text('password').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`).$onUpdate(() => new Date()),
});
