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

export const orders = sqliteTable('orders', {
	id: integer().primaryKey({ autoIncrement: true }),
	orderName: text().notNull(),
	productsId: integer().notNull(),
	amount: integer().notNull(),
	date: integer({ mode: 'timestamp' }).notNull(),
});
