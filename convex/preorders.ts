import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import {
	paginationOptsValidator,
	paginationResultValidator,
} from 'convex/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import schema, { preorderSectionValidator } from './schema';
import {
	MAX_ORDER_LINES,
	MAX_QUANTITY_PER_LINE,
	MAX_TOTAL_QUANTITY,
} from './preorderLimits';

const MAX_FORM_NAME_LENGTH = 120;
const MAX_PERSON_NAME_LENGTH = 80;
const MAX_SLUG_LENGTH = 128;

// Read bounds keep each operator page far away from transaction limits.
const MAX_FORM_PAGE_SIZE = 20;
const MAX_FORM_ITEMS = 200;
const MAX_FORM_TOTALS = 400;

// Submission bounds. These protect the unauthenticated endpoint from oversized
// payloads; they are intentionally generous for a real event. The public page
// reads the same values from ./preorderLimits so the two cannot drift.
const MAX_SUBMISSIONS_PER_FORM = 2_000;

const sectionValidator = preorderSectionValidator;

const adminFormItemValidator = v.object({
	_id: v.id('preorderFormItems'),
	productId: v.id('products'),
	productName: v.string(),
	section: sectionValidator,
	totalQuantity: v.number(),
});

const adminFormValidator = schema.doc('preorderForms').extend({
	items: v.array(adminFormItemValidator),
});

const publicFormItemValidator = v.object({
	productId: v.id('products'),
	// Match the inventory product field name used by the public page.
	productname: v.string(),
	picture: v.optional(v.string()),
	price: v.number(),
	section: sectionValidator,
});

const publicFormValidator = v.object({
	_id: v.id('preorderForms'),
	name: v.string(),
	eventDate: v.number(),
	closeAt: v.union(v.number(), v.null()),
	isActive: v.boolean(),
	status: v.union(v.literal('open'), v.literal('closed')),
	includeFood: v.boolean(),
	includeSnacks: v.boolean(),
	items: v.array(publicFormItemValidator),
});

const preparationTotalValidator = v.object({
	productId: v.id('products'),
	productName: v.string(),
	section: sectionValidator,
	totalQuantity: v.number(),
});

const submissionWithItemsValidator = schema.doc('preorderSubmissions').extend({
	items: v.array(schema.doc('preorderSubmissionItems')),
});

function requireFormName(value: string): string {
	const name = value.trim();
	if (!name) {
		throw new Error('Form name is required');
	}
	if (name.length > MAX_FORM_NAME_LENGTH) {
		throw new Error(
			`Form name must be at most ${MAX_FORM_NAME_LENGTH} characters`,
		);
	}
	return name;
}

function requirePersonName(value: string, label: string): string {
	const name = value.trim();
	if (!name) {
		throw new Error(`${label} is required`);
	}
	if (name.length > MAX_PERSON_NAME_LENGTH) {
		throw new Error(
			`${label} must be at most ${MAX_PERSON_NAME_LENGTH} characters`,
		);
	}
	return name;
}

function requireFiniteNumber(value: number, label: string): number {
	if (!Number.isFinite(value)) {
		throw new Error(`${label} must be a finite number`);
	}
	return value;
}

function isFormOpen(
	form: { isActive: boolean; closeAt: number | null },
	now: number,
): boolean {
	return form.isActive && (form.closeAt === null || form.closeAt > now);
}

/**
 * Generate an unguessable public link token. Convex indexes cannot be declared
 * unique, so collisions are checked before the form is inserted; with 128 bits
 * of randomness a retry is effectively never needed.
 */
async function createUniqueSlug(ctx: MutationCtx): Promise<string> {
	for (let attempt = 0; attempt < 5; attempt++) {
		const bytes = new Uint8Array(16);
		crypto.getRandomValues(bytes);
		const slug = Array.from(bytes, (byte) =>
			byte.toString(16).padStart(2, '0'),
		).join('');
		const existing = await ctx.db
			.query('preorderForms')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.first();
		if (!existing) {
			return slug;
		}
	}
	throw new Error('Could not generate a unique share link; please retry');
}

/**
 * Authenticated operator view of forms in reverse creation order, with their
 * configured products and preparation totals.
 */
export const listForms = query({
	args: { paginationOpts: paginationOptsValidator },
	returns: paginationResultValidator(adminFormValidator),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const formsPage = await ctx.db
			.query('preorderForms')
			.order('desc')
			.paginate({
				...args.paginationOpts,
				numItems: Math.min(
					args.paginationOpts.numItems,
					MAX_FORM_PAGE_SIZE,
				),
			});

		return {
			...formsPage,
			page: await Promise.all(
				formsPage.page.map(async (form) => {
					const [items, totals] = await Promise.all([
						ctx.db
							.query('preorderFormItems')
							.withIndex('by_formId', (q) =>
								q.eq('formId', form._id),
							)
							.take(MAX_FORM_ITEMS),
						ctx.db
							.query('preorderFormTotals')
							.withIndex('by_formId', (q) =>
								q.eq('formId', form._id),
							)
							.take(MAX_FORM_TOTALS),
					]);

					// Sum instead of assuming one counter document per product so any
					// concurrent first-submission inserts still produce a correct total.
					const totalByProduct = new Map<Id<'products'>, number>();
					for (const total of totals) {
						totalByProduct.set(
							total.productId,
							(totalByProduct.get(total.productId) ?? 0) +
								total.quantity,
						);
					}

					return {
						...form,
						items: items.map((item) => ({
							_id: item._id,
							productId: item.productId,
							productName: item.productName,
							section: item.section,
							totalQuantity:
								totalByProduct.get(item.productId) ?? 0,
						})),
					};
				}),
			),
		};
	},
});

/**
 * Create a named preorder form for an event. At least one onigiri product is
 * required; food and snack sections must be enabled for their items. This does
 * not touch inventory or sales.
 */
export const createForm = mutation({
	args: {
		name: v.string(),
		eventDate: v.number(),
		closeAt: v.union(v.number(), v.null()),
		includeFood: v.boolean(),
		includeSnacks: v.boolean(),
		isActive: v.boolean(),
		items: v.array(
			v.object({
				productId: v.id('products'),
				section: sectionValidator,
			}),
		),
	},
	returns: v.object({
		formId: v.id('preorderForms'),
		slug: v.string(),
	}),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const name = requireFormName(args.name);
		requireFiniteNumber(args.eventDate, 'Event date');
		if (args.closeAt !== null) {
			requireFiniteNumber(args.closeAt, 'Close time');
			if (args.isActive && args.closeAt <= Date.now()) {
				throw new Error('An active form must close in the future');
			}
		}
		if (args.items.length === 0 || args.items.length > MAX_FORM_ITEMS) {
			throw new Error(
				`A form must contain between 1 and ${MAX_FORM_ITEMS} products`,
			);
		}

		const seenProducts = new Set<Id<'products'>>();
		let onigiriCount = 0;

		for (const item of args.items) {
			if (seenProducts.has(item.productId)) {
				throw new Error('Each product can only appear once per form');
			}
			seenProducts.add(item.productId);

			if (item.section === 'food' && !args.includeFood) {
				throw new Error(
					'Food items require the food section to be enabled',
				);
			}
			if (item.section === 'snacks' && !args.includeSnacks) {
				throw new Error(
					'Snack items require the snacks section to be enabled',
				);
			}
			if (item.section === 'onigiri') {
				onigiriCount += 1;
			}
		}

		if (onigiriCount === 0) {
			throw new Error('At least one onigiri product is required');
		}

		const products = new Map<Id<'products'>, string>();
		for (const item of args.items) {
			const product = await ctx.db.get(item.productId);
			if (!product) {
				throw new Error('A selected product no longer exists');
			}
			if (
				product.category !== undefined &&
				product.category !== item.section
			) {
				throw new Error(
					`${product.productname} must be categorized as ${item.section} to appear in that preorder section`,
				);
			}
			products.set(item.productId, product.productname);
		}

		const now = Date.now();
		const slug = await createUniqueSlug(ctx);
		const formId = await ctx.db.insert('preorderForms', {
			name,
			eventDate: args.eventDate,
			closeAt: args.closeAt,
			isActive: args.isActive,
			slug,
			includeFood: args.includeFood,
			includeSnacks: args.includeSnacks,
			updatedAt: now,
		});

		for (const item of args.items) {
			await ctx.db.insert('preorderFormItems', {
				formId,
				productId: item.productId,
				productName: products.get(item.productId) ?? 'Product',
				section: item.section,
			});
			await ctx.db.insert('preorderFormTotals', {
				formId,
				productId: item.productId,
				quantity: 0,
				updatedAt: now,
			});
		}
		await ctx.db.insert('preorderFormStats', {
			formId,
			submissionCount: 0,
		});

		return { formId, slug };
	},
});

/** Turn the public link on or off without deleting collected submissions. */
export const setActive = mutation({
	args: {
		formId: v.id('preorderForms'),
		isActive: v.boolean(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const form = await ctx.db.get(args.formId);
		if (!form) {
			throw new Error('Preorder form not found');
		}
		if (form.isActive === args.isActive) {
			return null;
		}
		if (
			args.isActive &&
			form.closeAt !== null &&
			form.closeAt <= Date.now()
		) {
			throw new Error(
				'This form’s closing time has passed. Create a new form to accept preorders again.',
			);
		}

		await ctx.db.patch(args.formId, {
			isActive: args.isActive,
			updatedAt: Date.now(),
		});
		return null;
	},
});

/**
 * Public form configuration. Deliberately returns regular product prices only:
 * no helper price, stock, sales or submissions are exposed.
 */
export const publicForm = query({
	args: {
		slug: v.string(),
		// Supplied by the client so open/closed state is evaluated against a
		// fresh timestamp instead of a cached wall-clock read. Falls back to the
		// server clock for simple callers; submit always re-validates.
		now: v.optional(v.number()),
	},
	returns: v.union(v.null(), publicFormValidator),
	handler: async (ctx, args) => {
		const slug = args.slug.trim();
		if (!slug || slug.length > MAX_SLUG_LENGTH) {
			return null;
		}

		const now = args.now ?? Date.now();
		requireFiniteNumber(now, 'Current time');

		const form = await ctx.db
			.query('preorderForms')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.first();
		if (!form) {
			return null;
		}

		const configuredItems = await ctx.db
			.query('preorderFormItems')
			.withIndex('by_formId', (q) => q.eq('formId', form._id))
			.take(MAX_FORM_ITEMS);

		const items = [];
		let onigiriPricingLoaded = false;
		let onigiriPricing: Doc<'productCategoryPricing'> | null = null;
		for (const item of configuredItems) {
			const product = await ctx.db.get(item.productId);
			if (!product) {
				// A deleted inventory product cannot be preordered anymore.
				continue;
			}
			let price = product.price;
			if (product.category === 'onigiri') {
				if (!onigiriPricingLoaded) {
					// .first() instead of .unique(): a stray duplicate pricing row
					// (import/repair) must not break the public form.
					onigiriPricing = await ctx.db
						.query('productCategoryPricing')
						.withIndex('by_category', (q) =>
							q.eq('category', 'onigiri'),
						)
						.first();
					onigiriPricingLoaded = true;
				}
				if (onigiriPricing) price = onigiriPricing.price;
			}
			items.push({
				productId: product._id,
				productname: product.productname,
				...(product.picture === undefined
					? {}
					: { picture: product.picture }),
				price,
				section: item.section,
			});
		}

		return {
			_id: form._id,
			name: form.name,
			eventDate: form.eventDate,
			closeAt: form.closeAt,
			isActive: form.isActive,
			status: isFormOpen(form, now)
				? ('open' as const)
				: ('closed' as const),
			includeFood: form.includeFood,
			includeSnacks: form.includeSnacks,
			items,
		};
	},
});

/**
 * Unauthenticated preorder submission. Records the request only; it NEVER
 * reserves or deducts stock and never creates a sale.
 */
export const submit = mutation({
	args: {
		slug: v.string(),
		submissionToken: v.string(),
		firstName: v.string(),
		lastName: v.string(),
		isHelper: v.boolean(),
		confirmed: v.boolean(),
		items: v.array(
			v.object({
				productId: v.id('products'),
				quantity: v.number(),
			}),
		),
	},
	returns: v.object({
		submissionId: v.id('preorderSubmissions'),
		itemCount: v.number(),
		totalQuantity: v.number(),
		duplicate: v.boolean(),
	}),
	handler: async (ctx, args) => {
		if (!args.confirmed) {
			throw new Error('Please confirm the preorder before submitting');
		}

		const slug = args.slug.trim();
		if (!slug || slug.length > MAX_SLUG_LENGTH) {
			throw new Error('This preorder link is not valid');
		}
		const submissionToken = args.submissionToken.trim();
		if (submissionToken.length < 16 || submissionToken.length > 120) {
			throw new Error('This submission attempt is not valid');
		}

		const firstName = requirePersonName(args.firstName, 'First name');
		const lastName = requirePersonName(args.lastName, 'Last name');

		if (args.items.length === 0 || args.items.length > MAX_ORDER_LINES) {
			throw new Error(
				`A preorder must contain between 1 and ${MAX_ORDER_LINES} products`,
			);
		}

		const form = await ctx.db
			.query('preorderForms')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.first();
		if (!form) {
			throw new Error('This preorder form is not accepting orders');
		}

		const requested = new Map<Id<'products'>, number>();
		let totalQuantity = 0;
		for (const item of args.items) {
			if (
				!Number.isInteger(item.quantity) ||
				item.quantity <= 0 ||
				item.quantity > MAX_QUANTITY_PER_LINE
			) {
				throw new Error(
					`Quantities must be whole numbers between 1 and ${MAX_QUANTITY_PER_LINE}`,
				);
			}
			const quantity =
				(requested.get(item.productId) ?? 0) + item.quantity;
			if (quantity > MAX_QUANTITY_PER_LINE) {
				throw new Error(
					`Quantities must be whole numbers between 1 and ${MAX_QUANTITY_PER_LINE}`,
				);
			}
			requested.set(item.productId, quantity);
			totalQuantity += item.quantity;
		}

		if (totalQuantity > MAX_TOTAL_QUANTITY) {
			throw new Error(
				`A preorder may contain at most ${MAX_TOTAL_QUANTITY} items`,
			);
		}

		const existing = await ctx.db
			.query('preorderSubmissions')
			.withIndex('by_formId_and_submissionToken', (q) =>
				q.eq('formId', form._id).eq('submissionToken', submissionToken),
			)
			.unique();
		if (existing) {
			const existingItems = await ctx.db
				.query('preorderSubmissionItems')
				.withIndex('by_submissionId', (q) =>
					q.eq('submissionId', existing._id),
				)
				.take(MAX_ORDER_LINES);
			const sameItems =
				existingItems.length === requested.size &&
				Array.from(requested).every(([productId, quantity]) =>
					existingItems.some(
						(item) =>
							item.productId === productId &&
							item.quantity === quantity,
					),
				);
			if (
				existing.firstName !== firstName ||
				existing.lastName !== lastName ||
				existing.isHelper !== args.isHelper ||
				!sameItems
			) {
				throw new Error(
					'This submission attempt was already used. Please submit again.',
				);
			}
			return {
				submissionId: existing._id,
				itemCount: requested.size,
				totalQuantity,
				duplicate: true,
			};
		}

		if (!isFormOpen(form, Date.now())) {
			throw new Error('This preorder form is not accepting orders');
		}

		const formStats = await ctx.db
			.query('preorderFormStats')
			.withIndex('by_formId', (q) => q.eq('formId', form._id))
			.unique();
		if ((formStats?.submissionCount ?? 0) >= MAX_SUBMISSIONS_PER_FORM) {
			throw new Error(
				'This preorder form has reached its order limit. Please contact the event organizers.',
			);
		}

		const configuredItems = await ctx.db
			.query('preorderFormItems')
			.withIndex('by_formId', (q) => q.eq('formId', form._id))
			.take(MAX_FORM_ITEMS);
		const configured = new Map(
			configuredItems.map((item) => [item.productId, item]),
		);

		for (const productId of requested.keys()) {
			const item = configured.get(productId);
			if (!item) {
				throw new Error(
					'One of the selected products is not available on this form',
				);
			}
			if (item.section === 'food' && !form.includeFood) {
				throw new Error(
					'One of the selected products is not available on this form',
				);
			}
			if (item.section === 'snacks' && !form.includeSnacks) {
				throw new Error(
					'One of the selected products is not available on this form',
				);
			}

			const product = await ctx.db.get(productId);
			if (!product) {
				throw new Error(
					'One of the selected products is not available on this form',
				);
			}
		}

		const now = Date.now();
		const submissionId = await ctx.db.insert('preorderSubmissions', {
			formId: form._id,
			submissionToken,
			firstName,
			lastName,
			isHelper: args.isHelper,
			confirmed: true,
		});

		for (const [productId, quantity] of requested) {
			const item = configured.get(productId)!;
			await ctx.db.insert('preorderSubmissionItems', {
				formId: form._id,
				submissionId,
				productId,
				productName: item.productName,
				section: item.section,
				quantity,
			});

			const totals = await ctx.db
				.query('preorderFormTotals')
				.withIndex('by_formId_and_productId', (q) =>
					q.eq('formId', form._id).eq('productId', productId),
				)
				.first();
			if (totals) {
				await ctx.db.patch(totals._id, {
					quantity: totals.quantity + quantity,
					updatedAt: now,
				});
			} else {
				// Only possible for forms created before totals were initialized.
				await ctx.db.insert('preorderFormTotals', {
					formId: form._id,
					productId,
					quantity,
					updatedAt: now,
				});
			}
		}
		if (formStats) {
			await ctx.db.patch(formStats._id, {
				submissionCount: formStats.submissionCount + 1,
			});
		} else {
			await ctx.db.insert('preorderFormStats', {
				formId: form._id,
				submissionCount: 1,
			});
		}

		return {
			submissionId,
			itemCount: requested.size,
			totalQuantity,
			duplicate: false,
		};
	},
});

/** Paginated submissions with their line items, newest first. */
export const listSubmissions = query({
	args: {
		formId: v.id('preorderForms'),
		paginationOpts: paginationOptsValidator,
	},
	returns: paginationResultValidator(submissionWithItemsValidator),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const results = await ctx.db
			.query('preorderSubmissions')
			.withIndex('by_formId', (q) => q.eq('formId', args.formId))
			.order('desc')
			.paginate(args.paginationOpts);

		return {
			...results,
			page: await Promise.all(
				results.page.map(async (submission) => ({
					...submission,
					items: await ctx.db
						.query('preorderSubmissionItems')
						.withIndex('by_submissionId', (q) =>
							q.eq('submissionId', submission._id),
						)
						.take(MAX_FORM_ITEMS),
				})),
			),
		};
	},
});

/** Preparation quantity per configured product for one form. */
export const preparationTotals = query({
	args: { formId: v.id('preorderForms') },
	returns: v.array(preparationTotalValidator),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const form = await ctx.db.get(args.formId);
		if (!form) {
			throw new Error('Preorder form not found');
		}

		const [items, totals] = await Promise.all([
			ctx.db
				.query('preorderFormItems')
				.withIndex('by_formId', (q) => q.eq('formId', args.formId))
				.take(MAX_FORM_ITEMS),
			ctx.db
				.query('preorderFormTotals')
				.withIndex('by_formId', (q) => q.eq('formId', args.formId))
				.take(MAX_FORM_TOTALS),
		]);

		const totalByProduct = new Map<Id<'products'>, number>();
		for (const total of totals) {
			totalByProduct.set(
				total.productId,
				(totalByProduct.get(total.productId) ?? 0) + total.quantity,
			);
		}

		return items.map((item) => ({
			productId: item.productId,
			productName: item.productName,
			section: item.section,
			totalQuantity: totalByProduct.get(item.productId) ?? 0,
		}));
	},
});
