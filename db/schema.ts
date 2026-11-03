import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const entries = sqliteTable('entries', { id: text('id').primaryKey(), device: text('device').notNull().unique(), name: text('name').notNull(), created: integer('created').notNull(), played: integer('played').notNull().default(0), win: integer('win').notNull().default(0) });
export const draws = sqliteTable('draws', { id: integer('id').primaryKey(), winners: text('winners').notNull(), created: integer('created').notNull() });
