import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import {
	paginationOptsValidator,
	paginationResultValidator,
} from 'convex/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import schema, { preorderSectionValidator } from './schema';

const MAX_FORM_NAME_LENGTH = 120;
const MAX_PERSON_NAME_LENGTH = 80;
const MAX_SLUG_LENGTH = 128;

// Read bounds keep each operator page far away from transaction limits.
const MAX_FORM_PAGE_SIZE = 20;
const MAX_FORM_ITEMS = 200;
const MAX_FORM_TOTALS = 400;

// Submission bounds. These protect the unauthenticated endpoint from oversized
// payloads; they are intentionally generous for a real event.
const MAX_ORDER_LINES = 100;
const MAX_QUANTITY_PER_LINE = 20;
const MAX_TOTAL_QUANTITY = 300;
const MAX_SUBMISSIONS_PER_FORM = 2_000;

// Coarse per-client throttling on top of the per-form submission cap. A client
// identifier is browser-supplied and spoofable, so this only protects against
// accidental request loops and casual cap burning, not a determined attacker.
// Window documents are bounded per form by accepted submissions; explicit
// cleanup of expired rows is deliberately deferred until it is worth a cron.
const SUBMISSION_WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS_PER_CLIENT_WINDOW = 8;
const MAX_CLIENT_ID_LENGTH = 64;
// Consolidation bound for accidental duplicate window documents (see
// claimSubmissionWindow); production duplicates are far below this.
const MAX_WINDOW_DOCS = 8;

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

function requireClientId(value: string): string {
	const clientId = value.trim();
	if (!clientId || clientId.length > MAX_CLIENT_ID_LENGTH) {
		throw new Error('This submission attempt is not valid');
	}
	return clientId;
}

/**
 * Validate and advance the per-client submission window. Runs inside the
 * submit transaction so the window increment rolls back together with the
 * submission when the mutation fails; a validated retry with a used token
 * never reaches this helper and does not consume the window.
 *
 * The key is not covered by a unique index, so instead of `.unique()` this
 * consolidates any accidental duplicate documents: a re-insert race on a
 * missing document is otherwise committed twice (neither sees a read to
 * conflict on) and would make the later unique read throw forever.
 */
async function claimSubmissionWindow(
	ctx: MutationCtx,
	formId: Id<'preorderForms'>,
	clientId: string,
	now: number,
): Promise<void> {
	const windowDocs = await ctx.db
		.query('preorderFormSubmissionWindows')
		.withIndex('by_formId_and_clientId', (q) =>
			q.eq('formId', formId).eq('clientId', clientId),
		)
		.take(MAX_WINDOW_DOCS);
	if (windowDocs.length === 0) {
		await ctx.db.insert('preorderFormSubmissionWindows', {
			formId,
			clientId,
			windowStart: now,
			submissionCount: 1,
		});
		return;
	}

	const freshDocs = windowDocs.filter(
		(doc) => now - doc.windowStart < SUBMISSION_WINDOW_MS,
	);
	const windowCount = freshDocs.reduce(
		(total, doc) => total + doc.submissionCount,
		0,
	);
	if (windowCount >= MAX_SUBMISSIONS_PER_CLIENT_WINDOW) {
		throw new Error(
			'Too many orders were placed from this device recently. Please try again in about 10 minutes.',
		);
	}
	// Keep the earliest fresh window boundary; expired documents start a new
	// window at `now`. All duplicates are merged into the first document.
	const [canonical, ...duplicates] = windowDocs;
	if (!canonical) return;
	for (const doc of duplicates) {
		await ctx.db.delete(doc._id);
	}
	await ctx.db.patch(canonical._id, {
		windowStart:
			freshDocs.length > 0
				? Math.min(...freshDocs.map((doc) => doc.windowStart))
				: now,
		submissionCount: windowCount + 1,
	});
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
 * no helper price, stock, sales or submissions are exposed. When the form is
 * closed or inactive the item data (names, prices, pictures) is withheld:
 * inactive means inactive. Once closed, `submit` no longer accepts orders.
 */
export const publicForm = query({
	args: {
		slug: v.string(),
		// Supplied by the client so open/closed state is evaluated against a
		// fresh timestamp instead of a cached wall-clock read. A caller can
		// lie about `now` (e.g. pass a timestamp before the close time) to
		// read the item data of an active form whose window has passed; that
		// is accepted because item names and prices are not secrets, and
		// `submit` always re-validates with the server clock.
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

		// Closed or inactive forms disclose only their state, never items.
		if (!isFormOpen(form, now)) {
			return {
				_id: form._id,
				name: form.name,
				eventDate: form.eventDate,
				closeAt: form.closeAt,
				isActive: form.isActive,
				status: 'closed' as const,
				includeFood: form.includeFood,
				includeSnacks: form.includeSnacks,
				items: [],
			};
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
					onigiriPricing = await ctx.db
						.query('productCategoryPricing')
						.withIndex('by_category', (q) =>
							q.eq('category', 'onigiri'),
						)
						.unique();
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
			// The early return above guarantees the form is open here.
			status: 'open' as const,
			includeFood: form.includeFood,
			includeSnacks: form.includeSnacks,
			items,
		};
	},
});

/**
 * Unauthenticated preorder submission. Records the request only; it NEVER
 * reserves or deducts stock and never creates a sale. Rate limiting is coarse:
 * per (form, client identifier) window counters on top of the per-form cap.
 */
export const submit = mutation({
	args: {
		slug: v.string(),
		submissionToken: v.string(),
		clientId: v.string(),
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
		const clientId = requireClientId(args.clientId);

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
		// Coarse abuse throttle: counted only on accepted submissions, inside
		// the same transaction as their writes.
		await claimSubmissionWindow(ctx, form._id, clientId, now);
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

/**
 * Operator-only removal of one submission (duplicate, correction request, or
 * rate-limit abuse recovery). Decrements the preparation totals and the
 * submission counter so the records stay reviewable and the per-form cap
 * frees up. This does not touch sales, stock, or the submission windows.
 *
 * Note: removing a submission frees its idempotency token — an unchanged
 * retry of the same order can recreate it. When the removal target is
 * suspected abuse, deactivate the form first if resubmission must be
 * prevented.
 */
export const removeSubmission = mutation({
	args: { submissionId: v.id('preorderSubmissions') },
	returns: v.null(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		const submission = await ctx.db.get(args.submissionId);
		if (!submission) {
			// Already removed (e.g. a retry after a lost response); nothing to do.
			return null;
		}

		const items = await ctx.db
			.query('preorderSubmissionItems')
			.withIndex('by_submissionId', (q) =>
				q.eq('submissionId', args.submissionId),
			)
			.take(MAX_ORDER_LINES);

		const now = Date.now();
		for (const item of items) {
			// Subtract across every totals document for the product: totals
			// documents are summed on the read paths, so stopping at the first
			// match could leave the preparation total overstated.
			let remaining = item.quantity;
			const totalsDocs = await ctx.db
				.query('preorderFormTotals')
				.withIndex('by_formId_and_productId', (q) =>
					q.eq('formId', item.formId).eq('productId', item.productId),
				)
				.take(MAX_FORM_TOTALS);
			for (const totals of totalsDocs) {
				if (remaining === 0) break;
				const subtracted = Math.min(totals.quantity, remaining);
				await ctx.db.patch(totals._id, {
					quantity: totals.quantity - subtracted,
					updatedAt: now,
				});
				remaining -= subtracted;
			}
			// Totals should never fall below the recorded submissions. Reaching
			// this point means the bookkeeping has drifted; surface it to the
			// operator instead of silently normalizing it away (the transaction
			// rolls back, so nothing is half-removed).
			if (remaining > 0) {
				throw new Error(
					`Preparation totals for ${item.productName} are inconsistent (missing ${remaining} items). The removal was aborted; nothing was changed.`,
				);
			}
			await ctx.db.delete(item._id);
		}

		const stats = await ctx.db
			.query('preorderFormStats')
			.withIndex('by_formId', (q) => q.eq('formId', submission.formId))
			.unique();
		if (stats && stats.submissionCount > 0) {
			await ctx.db.patch(stats._id, {
				submissionCount: stats.submissionCount - 1,
			});
		}

		await ctx.db.delete(args.submissionId);
		return null;
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
