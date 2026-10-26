import { query, mutation } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import {
	paginationOptsValidator,
	paginationResultValidator,
} from 'convex/server';
import { v } from 'convex/values';
import schema from './schema';

type OrderUpdates = Partial<
	Pick<Doc<'orders'>, 'orderName' | 'productsId' | 'amount'>
>;

function validateAmount(amount: number) {
	if (!Number.isInteger(amount) || amount <= 0) {
		throw new Error('Order amount must be a positive integer');
	}
}

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
		validateAmount(args.amount);

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

		const updates: OrderUpdates = {};
		if (args.orderName !== undefined) updates.orderName = args.orderName;
		if (args.productsId !== undefined) updates.productsId = args.productsId;
		if (args.amount !== undefined) {
			validateAmount(args.amount);
			updates.amount = args.amount;
		}

		// If updating product, verify it exists
		if (updates.productsId !== undefined) {
			const product = await ctx.db.get(updates.productsId);
			if (!product) {
				throw new Error('Product not found');
			}
		}

		return await ctx.db.patch(args.id, updates);
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
