import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		return await ctx.db.query('transactions').order('desc').take(100);
	},
});

export const create = mutation({
	args: {
		productId: v.id('products'),
		amount: v.number(),
		previousAmount: v.number(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const user = await ctx.db
			.query('users')
			.withIndex('by_authId', (q) =>
				q.eq('authId', identity.tokenIdentifier),
			)
			.unique();
		if (!user) {
			throw new Error('User profile not found');
		}

		await ctx.db.insert('transactions', {
			productsId: args.productId,
			amount: args.amount,
			user: user._id,
			previousAmount: args.previousAmount,
			timestamp: Date.now(),
		});
	},
});
