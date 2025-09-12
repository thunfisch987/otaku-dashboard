import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
	args: {},
	handler: async (ctx) => {
		const orders = await ctx.db.query('orders').order('desc').collect();

		// Fetch product details for each order
		const ordersWithProducts = await Promise.all(
			orders.map(async (order) => {
				const product = await ctx.db.get(order.productsId);
				return {
					...order,
					product,
				};
			}),
		);

		return ordersWithProducts;
	},
});

export const getById = query({
	args: { id: v.id('orders') },
	handler: async (ctx, args) => {
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

		const filteredUpdates = Object.fromEntries(
			Object.entries(updates).filter(([_, value]) => value !== undefined),
		);

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
