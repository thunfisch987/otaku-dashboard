import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, check } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text().primaryKey(),
	name: text().notNull(),
	givenName: text().notNull(),
	familyName: text().notNull(),
	email: text().notNull().unique(),
	avatar: text().notNull(),
	createdAt: integer({ mode: 'timestamp' }).notNull(),
	lastLogin: integer({ mode: 'timestamp' }).notNull(),
});

export const passkeys = sqliteTable('passkeys', {
	userId: text()
		.notNull()

		.references(() => users.id, {
			onDelete: 'cascade',
			onUpdate: 'cascade',
		})
		.primaryKey(),
	id: text().unique().notNull(),
	publicKey: text().notNull(),
	counter: integer().notNull(),
	backedUp: integer().notNull(),
	transports: text().notNull(),
});

export const products = sqliteTable(
	'products',
	{
		id: integer().primaryKey({ autoIncrement: true }),
		productname: text().unique().notNull(),
		picture: text(),
		price: integer().notNull().default(0),
		supplier: text().notNull(),
		amount: integer().notNull().default(0),
		createdAt: integer({ mode: 'timestamp' }).notNull(),
		updatedAt: integer({ mode: 'timestamp' }).notNull(),
	},
	(table) => [
		check('supplier_check', sql`${table.supplier} IN ("HDJ", "Otaku")`),
		check('price_check', sql`${table.price} >= 0`),
	],
);
