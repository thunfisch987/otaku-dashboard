import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('transactions').order('desc').collect();
	},
});

export const create = mutation({
	args: {
		productId: v.id('products'),
		amount: v.number(),
		userId: v.id('users'),
		previousAmount: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert('transactions', {
			productsId: args.productId,
			amount: args.amount,
			user: args.userId,
			previousAmount: args.previousAmount,
			timestamp: Date.now(),
		});
	},
});
