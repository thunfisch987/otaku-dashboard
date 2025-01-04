import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	avatar: text('avatar').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const products = sqliteTable('products', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').unique().notNull(),
	picture: text('picture'),
	price: integer('price').notNull(),
	supplier: text('supplier').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
},
(table) => [
	check('supplier_check', sql`${table.supplier} IN ("HDJ", "Otaku")`),
]);
