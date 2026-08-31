import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { availableMemory } from 'process';

const applicationTables = {
	products: defineTable({
		productname: v.string(),
		picture: v.optional(v.string()),
		price: v.number(),
		supplier: v.union(v.literal('HDJ'), v.literal('Otaku')),
		amount: v.number(),
		updatedAt: v.number(),
	})
		.index('by_productname', ['productname'])
		.index('by_supplier', ['supplier']),

	orders: defineTable({
		orderName: v.string(),
		productsId: v.id('products'),
		amount: v.number(),
		date: v.number(),
	})
		.index('by_product', ['productsId'])
		.index('by_date', ['date']),

	images: defineTable({
		storageId: v.id('_storage'),
		url: v.string(),
	}).index('by_url', ['url']),

	users: defineTable({
		authId: v.string(),
		name: v.string(),
		email: v.string(),
		avatar: v.optional(v.string()),
	})
		.index('by_authId', ['authId'])
		.index('by_name', ['name'])
		.index('by_email', ['email']),

	transactions: defineTable({
		productsId: v.id('products'),
		previousAmount: v.number(),
		amount: v.number(),
		user: v.id('users'),
		timestamp: v.number(),
	})
		.index('by_user', ['user'])
		.index('by_timestamp', ['timestamp']),
};

export default defineSchema({
	...applicationTables,
});
