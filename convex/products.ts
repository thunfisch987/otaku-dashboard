import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('products').order('desc').collect();
	},
});

export const getById = query({
	args: { id: v.id('products') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const create = mutation({
	args: {
		productname: v.string(),
		picture: v.optional(v.string()),
		price: v.number(),
		supplier: v.union(v.literal('HDJ'), v.literal('Otaku')),
		amount: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await ctx.auth.getUserIdentity();
		if (!userId) {
			throw new Error('Not authenticated!');
		}
		if (args.price < 0) {
			throw new Error('Price must be non-negative!');
		}

		const now = Date.now();
		return await ctx.db.insert('products', {
			...args,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id('products'),
		productname: v.optional(v.string()),
		picture: v.optional(v.string()),
		price: v.optional(v.number()),
		supplier: v.optional(v.union(v.literal('HDJ'), v.literal('Otaku'))),
		amount: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await ctx.auth.getUserIdentity();
		if (!userId) {
			throw new Error('Not authenticated!');
		}

		const { id, ...updates } = args;

		if (updates.price !== undefined && updates.price < 0) {
			throw new Error('Price must be non-negative!');
		}

		const filteredUpdates = Object.fromEntries(
			Object.entries(updates).filter(([_, value]) => value !== undefined),
		);

		if (Object.keys(filteredUpdates).length > 0) {
			filteredUpdates.updatedAt = Date.now();
		}

		return await ctx.db.patch(id, filteredUpdates);
	},
});

export const remove = mutation({
	args: { id: v.id('products') },
	handler: async (ctx, args) => {
		const userId = await ctx.auth.getUserIdentity();
		if (!userId) {
			throw new Error('Not authenticated!');
		}

		return await ctx.db.delete(args.id);
	},
});

export const removeMany = mutation({
	args: { ids: v.array(v.id('products')) },
	handler: async (ctx, args) => {
		const userId = await ctx.auth.getUserIdentity();
		if (!userId) {
			throw new Error('Not authenticated!');
		}
		await Promise.all(args.ids.map((id) => ctx.db.delete(id)));
	},
});

export const decreaseAmount = mutation({
	args: { id: v.id('products') },
	handler: async (ctx, args) => {
		const userId = await ctx.auth.getUserIdentity();
		if (!userId) {
			throw new Error('Not authenticated!');
		}
		const previousAmount = await ctx.db.get(args.id);
		if (!previousAmount) {
			throw new Error('Product not found!');
		}
		const newAmount = previousAmount.amount - 1;
		if (newAmount < 0) {
			throw new Error('Amount cannot be negative!');
		}
		return await ctx.db.patch(args.id, { amount: newAmount });
	},
});
