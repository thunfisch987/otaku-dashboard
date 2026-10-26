import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

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
		avatarStorageId: v.optional(v.id('_storage')),
		avatarCachePendingUrl: v.optional(v.union(v.string(), v.null())),
	})
		.index('by_authId', ['authId'])
		.index('by_name', ['name'])
		.index('by_email', ['email']),

	sales: defineTable({
		checkoutId: v.string(),
		user: v.id('users'),
		operatorName: v.string(),
		timestamp: v.number(),
		total: v.number(),
	})
		.index('by_checkoutId', ['checkoutId'])
		.index('by_timestamp', ['timestamp']),

	saleItems: defineTable({
		saleId: v.id('sales'),
		productsId: v.id('products'),
		productName: v.string(),
		unitPrice: v.number(),
		quantity: v.number(),
		lineTotal: v.number(),
	}).index('by_saleId', ['saleId']),
};

export default defineSchema({
	...applicationTables,
});
