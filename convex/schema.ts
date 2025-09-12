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
};

export default defineSchema({
	...applicationTables,
});
