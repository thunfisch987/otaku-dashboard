import { query, mutation } from './_generated/server';
import {
	paginationOptsValidator,
	paginationResultValidator,
} from 'convex/server';
import { v } from 'convex/values';
import schema from './schema';
import type { Id } from './_generated/dataModel';

export const checkout = mutation({
	args: {
		checkoutId: v.string(),
		items: v.array(
			v.object({
				productId: v.id('products'),
				quantity: v.number(),
			}),
		),
	},
	returns: v.object({
		saleId: v.id('sales'),
		total: v.number(),
		duplicate: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		if (!args.checkoutId.trim()) {
			throw new Error('Checkout identifier is required');
		}
		if (args.items.length === 0 || args.items.length > 100) {
			throw new Error(
				'A checkout must contain between 1 and 100 products',
			);
		}

		const existingSale = await ctx.db
			.query('sales')
			.withIndex('by_checkoutId', (q) =>
				q.eq('checkoutId', args.checkoutId),
			)
			.unique();
		if (existingSale) {
			return {
				saleId: existingSale._id,
				total: existingSale.total,
				duplicate: true,
			};
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

		const quantities = new Map<Id<'products'>, number>();
		for (const item of args.items) {
			if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
				throw new Error(
					'Product quantities must be positive whole numbers',
				);
			}
			quantities.set(
				item.productId,
				(quantities.get(item.productId) ?? 0) + item.quantity,
			);
		}

		const checkoutItems = [];
		let totalCents = 0;
		for (const [productId, quantity] of quantities) {
			const product = await ctx.db.get(productId);
			if (!product) {
				throw new Error('A product in this checkout no longer exists');
			}
			if (product.amount < quantity) {
				throw new Error(`Not enough stock for ${product.productname}`);
			}
			const lineTotal =
				(Math.round(product.price * 100) * quantity) / 100;
			checkoutItems.push({ product, quantity, lineTotal });
			totalCents += Math.round(product.price * 100) * quantity;
		}

		const total = totalCents / 100;
		const timestamp = Date.now();
		const saleId = await ctx.db.insert('sales', {
			checkoutId: args.checkoutId,
			user: user._id,
			operatorName:
				user.name || identity.name || identity.email || 'Operator',
			timestamp,
			total,
		});

		for (const { product, quantity, lineTotal } of checkoutItems) {
			const updatedAmount = product.amount - quantity;
			await ctx.db.patch(product._id, {
				amount: updatedAmount,
				updatedAt: timestamp,
			});
			await ctx.db.insert('saleItems', {
				saleId,
				productsId: product._id,
				productName: product.productname,
				unitPrice: product.price,
				quantity,
				lineTotal,
			});
		}

		return { saleId, total, duplicate: false };
	},
});

export const revertSale = mutation({
	args: {
		saleId: v.id('sales'),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const sale = await ctx.db.get(args.saleId);
		if (!sale) {
			throw new Error('Sale no longer exists');
		}

		const items = await ctx.db
			.query('saleItems')
			.withIndex('by_saleId', (q) => q.eq('saleId', args.saleId))
			.collect();

		// Restore stock for every product in the sale, then track the items
		// for deletion so the whole sale is reverted as one unit.
		for (const item of items) {
			const product = await ctx.db.get(item.productsId);
			if (!product) {
				throw new Error(
					`Product ${item.productName} no longer exists; stock cannot be restored`,
				);
			}
			await ctx.db.patch(product._id, {
				amount: product.amount + item.quantity,
				updatedAt: Date.now(),
			});
		}

		for (const item of items) {
			await ctx.db.delete(item._id);
		}
		await ctx.db.delete(args.saleId);
		return null;
	},
});

export const listSalesForDay = query({
	args: {
		dayStart: v.number(),
		dayEnd: v.number(),
		paginationOpts: paginationOptsValidator,
	},
	returns: paginationResultValidator(
		schema.doc('sales').extend({
			items: v.array(schema.doc('saleItems')),
		}),
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		if (
			!Number.isFinite(args.dayStart) ||
			!Number.isFinite(args.dayEnd) ||
			args.dayEnd <= args.dayStart
		) {
			throw new Error('Invalid selected day');
		}

		const results = await ctx.db
			.query('sales')
			.withIndex('by_timestamp', (q) =>
				q.gte('timestamp', args.dayStart).lt('timestamp', args.dayEnd),
			)
			.order('desc')
			.paginate(args.paginationOpts);

		return {
			...results,
			page: await Promise.all(
				results.page.map(async (sale) => ({
					...sale,
					items: await ctx.db
						.query('saleItems')
						.withIndex('by_saleId', (q) => q.eq('saleId', sale._id))
						.take(100),
				})),
			),
		};
	},
});
