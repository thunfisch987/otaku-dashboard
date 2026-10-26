import { query, mutation } from './_generated/server';
import {
	paginationOptsValidator,
	paginationResultValidator,
} from 'convex/server';
import { v } from 'convex/values';
import schema from './schema';

export const list = query({
	args: { paginationOpts: paginationOptsValidator },
	returns: paginationResultValidator(schema.doc('products')),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		return await ctx.db
			.query('products')
			.order('desc')
			.paginate(args.paginationOpts);
	},
});

export const getById = query({
	args: { id: v.id('products') },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

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
			throw new Error('Price must be non-negative');
		}
		if (!Number.isFinite(args.price)) {
			throw new Error('Price must be a finite number');
		}
		if (!Number.isInteger(args.amount) || args.amount < 0) {
			throw new Error('Amount must be a non-negative integer');
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
			throw new Error('Price must be non-negative');
		}
		if (updates.price !== undefined && !Number.isFinite(updates.price)) {
			throw new Error('Price must be a finite number');
		}
		if (
			updates.amount !== undefined &&
			(!Number.isInteger(updates.amount) || updates.amount < 0)
		) {
			throw new Error('Amount must be a non-negative integer');
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
