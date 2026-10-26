import { query, mutation } from './_generated/server';
import {
	paginationOptsValidator,
	paginationResultValidator,
} from 'convex/server';
import { v } from 'convex/values';
import schema from './schema';

export const list = query({
	args: { paginationOpts: paginationOptsValidator },
	returns: paginationResultValidator(schema.doc('orders')),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		return await ctx.db
			.query('orders')
			.order('desc')
			.paginate(args.paginationOpts);
	},
});

export const getById = query({
	args: { id: v.id('orders') },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const order = await ctx.db.get(args.id);
		if (!order) return null;

		const product = await ctx.db.get(order.productsId);
		return {
			...order,
			product,
		};
	},
});

export const create = mutation({
	args: {
		orderName: v.string(),
		productsId: v.id('products'),
		amount: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await ctx.auth.getUserIdentity();
		if (!userId) {
			throw new Error('Not authenticated');
		}

		// Verify product exists
		const product = await ctx.db.get(args.productsId);
		if (!product) {
			throw new Error('Product not found');
		}

		return await ctx.db.insert('orders', {
			...args,
			date: Date.now(),
		});
	},
});

export const update = mutation({
	args: {
		id: v.id('orders'),
		orderName: v.optional(v.string()),
		productsId: v.optional(v.id('products')),
		amount: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await ctx.auth.getUserIdentity();
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const { id, ...updates } = args;

		// If updating product, verify it exists
		if (updates.productsId) {
			const product = await ctx.db.get(updates.productsId);
			if (!product) {
				throw new Error('Product not found');
			}
		}

		// remove undefined fields from updates
		const filteredUpdates: Record<string, unknown> = {};
		let hasUpdates = false;

		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				filteredUpdates[key] = value;
				hasUpdates = true;
			}
		}

		if (hasUpdates) {
			filteredUpdates.updatedAt = Date.now();
		}

		return await ctx.db.patch(id, filteredUpdates);
	},
});

export const remove = mutation({
	args: { id: v.id('orders') },
	handler: async (ctx, args) => {
		const userId = await ctx.auth.getUserIdentity();
		if (!userId) {
			throw new Error('Not authenticated');
		}

		return await ctx.db.delete(args.id);
	},
});
