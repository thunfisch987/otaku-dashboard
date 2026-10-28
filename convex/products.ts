import { query, mutation } from './_generated/server';
import type { MutationCtx, QueryCtx } from './_generated/server';
import {
	paginationOptsValidator,
	paginationResultValidator,
} from 'convex/server';
import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import schema, { productCategoryValidator } from './schema';

type ProductContext = QueryCtx | MutationCtx;

function requireFiniteNumberArg(value: number) {
	if (!Number.isFinite(value)) {
		throw new Error('Current time must be a finite number');
	}
	return value;
}

async function readOnigiriPricing(ctx: ProductContext) {
	// .first() instead of .unique(): a stray duplicate pricing row (from an
	// import, migration or manual repair) must not break every read. The
	// update mutation removes duplicates, so the row it returns is kept.
	return await ctx.db
		.query('productCategoryPricing')
		.withIndex('by_category', (q) => q.eq('category', 'onigiri'))
		.first();
}

function applyOnigiriPricing<
	T extends { category?: string; price: number; helperPrice?: number },
>(product: T, pricing: Awaited<ReturnType<typeof readOnigiriPricing>>): T {
	if (product.category !== 'onigiri' || !pricing) return product;
	const { helperPrice: _storedHelperPrice, ...productFields } = product;
	return {
		...productFields,
		price: pricing.price,
		...(pricing.helperPrice === undefined
			? {}
			: { helperPrice: pricing.helperPrice }),
	} as T;
}

export const list = query({
	args: { paginationOpts: paginationOptsValidator },
	returns: paginationResultValidator(schema.doc('products')),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const page = await ctx.db
			.query('products')
			.order('desc')
			.paginate(args.paginationOpts);
		const pricing = await readOnigiriPricing(ctx);
		return {
			...page,
			page: page.page.map((product) =>
				applyOnigiriPricing(product, pricing),
			),
		};
	},
});

export const getById = query({
	args: { id: v.id('products') },
	returns: v.union(v.null(), schema.doc('products')),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const product = await ctx.db.get(args.id);
		if (!product) return null;
		return applyOnigiriPricing(product, await readOnigiriPricing(ctx));
	},
});

/** Read the shared price used by every product categorized as Onigiri. */
export const getOnigiriPricing = query({
	args: {},
	returns: v.union(v.null(), schema.doc('productCategoryPricing')),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		return await readOnigiriPricing(ctx);
	},
});

/** How much a shared Onigiri price change would affect, shown before saving. */
export const getOnigiriPricingImpact = query({
	args: { now: v.number() },
	returns: v.object({
		onigiriProductCount: v.number(),
		activeFormCount: v.number(),
		countsTruncated: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		requireFiniteNumberArg(args.now);

		// The operator tables are small (a single event's inventory), so a
		// bounded scan is exact in practice. When a rescan hits the bound the
		// counts are floors, reported to the client so it can say "at least".
		const BOUND = 2000;
		const products = await ctx.db.query('products').take(BOUND);
		const onigiriProductCount = products.filter(
			(product) => product.category === 'onigiri',
		).length;
		const forms = await ctx.db.query('preorderForms').take(BOUND);
		// Forms currently accepting orders (marked active and not past their
		// close time); the client passes its clock so no wall-clock read is
		// needed here. Onigiri-section items of these forms use the shared
		// price wherever the product is still categorized as onigiri.
		const activeFormCount = forms.filter(
			(form) =>
				form.isActive &&
				(form.closeAt === null || form.closeAt > args.now),
		).length;
		const countsTruncated =
			products.length === BOUND || forms.length === BOUND;

		return { onigiriProductCount, activeFormCount, countsTruncated };
	},
});

/** Update the shared regular/helper prices for all Onigiri products. */
export const updateOnigiriPricing = mutation({
	args: {
		price: v.number(),
		helperPrice: v.union(v.number(), v.null()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}
		if (!Number.isFinite(args.price) || args.price <= 0) {
			throw new Error(
				'Onigiri regular price must be a number above 0. ' +
					'The save was rejected and every Onigiri product keeps its ' +
					'current price.',
			);
		}
		if (
			args.helperPrice !== null &&
			(!Number.isFinite(args.helperPrice) || args.helperPrice < 0)
		) {
			throw new Error(
				'Helper price must be a finite non-negative number',
			);
		}
		if (args.helperPrice !== null && args.helperPrice > args.price) {
			throw new Error(
				'Helper price cannot be higher than the regular price',
			);
		}

		// A duplicate pricing row would make .unique() reads throw.
		// .first() keeps reads working; saving removes the extra rows so the
		// table self-heals towards one canonical row.
		const pricingRows = await ctx.db
			.query('productCategoryPricing')
			.withIndex('by_category', (q) => q.eq('category', 'onigiri'))
			.take(100);
		const pricing = pricingRows[0] ?? null;
		for (const duplicate of pricingRows.slice(1)) {
			await ctx.db.delete(duplicate._id);
		}
		const updatedAt = Date.now();
		if (pricing) {
			await ctx.db.patch(pricing._id, {
				price: args.price,
				helperPrice:
					args.helperPrice === null ? undefined : args.helperPrice,
				updatedAt,
			});
		} else {
			await ctx.db.insert('productCategoryPricing', {
				category: 'onigiri',
				price: args.price,
				...(args.helperPrice === null
					? {}
					: { helperPrice: args.helperPrice }),
				updatedAt,
			});
		}
		return null;
	},
});

export const create = mutation({
	args: {
		productname: v.string(),
		picture: v.optional(v.string()),
		price: v.number(),
		helperPrice: v.optional(v.number()),
		category: v.optional(productCategoryValidator),
		supplier: v.union(v.literal('HDJ'), v.literal('Otaku')),
		amount: v.number(),
	},
	returns: v.id('products'),
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
		if (
			args.helperPrice !== undefined &&
			(!Number.isFinite(args.helperPrice) || args.helperPrice < 0)
		) {
			throw new Error(
				'Helper price must be a finite non-negative number',
			);
		}
		if (!Number.isInteger(args.amount) || args.amount < 0) {
			throw new Error('Amount must be a non-negative integer');
		}

		const now = Date.now();
		const category = args.category ?? 'other';
		let price = args.price;
		let helperPrice = args.helperPrice;
		let onigiriPricing: Doc<'productCategoryPricing'> | null = null;
		if (category === 'onigiri') {
			onigiriPricing = await readOnigiriPricing(ctx);
			if (onigiriPricing) {
				if (onigiriPricing.price <= 0) {
					// A corrupt or legacy zero-price row would zero every
					// onigiri product at POS.
					throw new Error(
						'The shared Onigiri regular price is not above 0. ' +
							'Fix the Shared Onigiri prices in Inventory ' +
							'before creating an Onigiri product.',
					);
				}
				// Shared pricing wins for the regular price; conflicting
				// helper-price input is rejected, never applied globally or
				// silently discarded.
				if (
					args.helperPrice !== undefined &&
					args.helperPrice !== onigiriPricing.helperPrice
				) {
					throw new Error(
						'Onigiri prices are shared by every Onigiri ' +
							'product and currently exist. Change the helper ' +
							'price in the Shared Onigiri prices card in ' +
							'Inventory; the product was not created.',
					);
				}
				price = onigiriPricing.price;
				helperPrice = onigiriPricing.helperPrice;
			} else if (price <= 0) {
				// The first onigiri product seeds the shared pricing row; a
				// zero regular price would zero every future onigiri product.
				throw new Error(
					'Onigiri regular price must be a number above 0. ' +
						'The product was not created.',
				);
			}
		}
		if (helperPrice !== undefined && helperPrice > price) {
			throw new Error(
				'Helper price cannot be higher than the regular price',
			);
		}
		const { helperPrice: _inputHelperPrice, ...productFields } = args;
		if (category === 'onigiri' && !onigiriPricing) {
			// Seed the shared pricing row from the operator's input.
			await ctx.db.insert('productCategoryPricing', {
				category: 'onigiri',
				price,
				...(helperPrice === undefined ? {} : { helperPrice }),
				updatedAt: now,
			});
		}
		return await ctx.db.insert('products', {
			...productFields,
			category,
			price,
			...(helperPrice === undefined ? {} : { helperPrice }),
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
		helperPrice: v.optional(v.union(v.number(), v.null())),
		category: v.optional(productCategoryValidator),
		supplier: v.optional(v.union(v.literal('HDJ'), v.literal('Otaku'))),
		amount: v.optional(v.number()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await ctx.auth.getUserIdentity();
		if (!userId) {
			throw new Error('Not authenticated!');
		}

		const { id, ...updates } = args;
		const existingProduct = await ctx.db.get(id);
		if (!existingProduct) {
			throw new Error('Product not found');
		}

		if (updates.price !== undefined && updates.price < 0) {
			throw new Error('Price must be non-negative');
		}
		if (updates.price !== undefined && !Number.isFinite(updates.price)) {
			throw new Error('Price must be a finite number');
		}
		if (
			updates.helperPrice !== undefined &&
			updates.helperPrice !== null &&
			(!Number.isFinite(updates.helperPrice) || updates.helperPrice < 0)
		) {
			throw new Error(
				'Helper price must be a finite non-negative number',
			);
		}
		if (
			updates.amount !== undefined &&
			(!Number.isInteger(updates.amount) || updates.amount < 0)
		) {
			throw new Error('Amount must be a non-negative integer');
		}

		const existingPricing =
			existingProduct.category === 'onigiri'
				? await readOnigiriPricing(ctx)
				: null;
		const effectiveCurrentPrice =
			existingPricing?.price ?? existingProduct.price;
		const effectiveCurrentHelperPrice = existingPricing
			? existingPricing.helperPrice
			: existingProduct.helperPrice;
		const category =
			updates.category ?? existingProduct.category ?? 'other';
		let price = updates.price ?? effectiveCurrentPrice;
		let helperPrice =
			updates.helperPrice === null
				? undefined
				: (updates.helperPrice ?? effectiveCurrentHelperPrice);

		let onigiriPricing: Doc<'productCategoryPricing'> | null = null;
		if (category === 'onigiri') {
			// Reuse the read made for the effective current values when the
			// product was already onigiri; only a newly-onigiri product needs
			// a fresh read.
			onigiriPricing =
				existingProduct.category === 'onigiri'
					? existingPricing
					: await readOnigiriPricing(ctx);
			if (onigiriPricing) {
				if (onigiriPricing.price <= 0) {
					// A corrupt or legacy zero-price row would zero every
					// onigiri product at POS.
					throw new Error(
						'The shared Onigiri regular price is not above 0. ' +
							'Fix the Shared Onigiri prices in Inventory ' +
							'before changing an Onigiri product.',
					);
				}
				// Shared pricing wins for the regular price; conflicting
				// helper-price input is rejected, never applied globally or
				// silently discarded.
				if (updates.helperPrice !== undefined) {
					const entered =
						updates.helperPrice === null
							? undefined
							: updates.helperPrice;
					if (entered !== onigiriPricing.helperPrice) {
						throw new Error(
							'Onigiri prices are shared by every Onigiri ' +
								'product and currently exist. Change the ' +
								'helper price in the Shared Onigiri prices ' +
								'card in Inventory; the product was not ' +
								'changed.',
						);
					}
					helperPrice = entered;
				} else {
					helperPrice = onigiriPricing.helperPrice;
				}
				price = onigiriPricing.price;
			} else if (price <= 0) {
				// This update would seed the shared pricing row; a zero
				// regular price would zero every onigiri product.
				throw new Error(
					'Onigiri regular price must be a number above 0. ' +
						'The product was not changed.',
				);
			}
		}

		if (price < 0 || !Number.isFinite(price)) {
			throw new Error('Price must be a finite non-negative number');
		}
		if (
			helperPrice !== undefined &&
			(!Number.isFinite(helperPrice) || helperPrice < 0)
		) {
			throw new Error(
				'Helper price must be a finite non-negative number',
			);
		}
		if (helperPrice !== undefined && helperPrice > price) {
			throw new Error(
				'Helper price cannot be higher than the regular price',
			);
		}

		if (category === 'onigiri' && !onigiriPricing) {
			// Seed the shared pricing row from this update.
			await ctx.db.insert('productCategoryPricing', {
				category: 'onigiri',
				price,
				...(helperPrice === undefined ? {} : { helperPrice }),
				updatedAt: Date.now(),
			});
		}

		const productUpdates: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) productUpdates[key] = value;
		}
		await ctx.db.patch(id, {
			...productUpdates,
			category,
			price,
			helperPrice,
			updatedAt: Date.now(),
		});
		return null;
	},
});

export const remove = mutation({
	args: { id: v.id('products') },
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await ctx.auth.getUserIdentity();
		if (!userId) {
			throw new Error('Not authenticated!');
		}

		await ctx.db.delete(args.id);
		return null;
	},
});

export const removeMany = mutation({
	args: { ids: v.array(v.id('products')) },
	returns: v.null(),
	handler: async (ctx, args) => {
		const userId = await ctx.auth.getUserIdentity();
		if (!userId) {
			throw new Error('Not authenticated!');
		}
		await Promise.all(args.ids.map((id) => ctx.db.delete(id)));
		return null;
	},
});
