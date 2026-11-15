/**
 * Dev-only fixtures for automated browser checks.
 *
 * Seeds a login-capable operator account plus a small, coherent demo dataset
 * (stock, sales history, an active preorder form with submissions) so agents
 * can verify signed-in pages without touching real data. Every function here
 * refuses to run unless ENABLE_DEV_TOOLS is set on a non-production site URL.
 *
 * Demo rows are recognizable and removable: products start with "[demo] ",
 * sales with the "dev-seed-" checkout prefix, and the form uses the "dev-demo"
 * slug. `bun run seed:dev:reset` wipes them before reseeding.
 */
import { v } from 'convex/values';
import { components, internal } from './_generated/api';
import {
	internalAction,
	internalMutation,
	internalQuery,
} from './_generated/server';
import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { createAuth } from './auth';
import { getDevAuthEmail, getDevAuthPassword, isDevToolsEnabled } from './env';

const DEMO_PREFIX = '[demo] ';
const DEMO_SALE_PREFIX = 'dev-seed-';
const DEMO_FORM_SLUG = 'dev-demo';
const DEMO_FORM_NAME = 'Demo Matsuri';
const DEV_OPERATOR_NAME = 'Dev Operator';
const DAY_MS = 24 * 60 * 60 * 1000;

// Demo data is small; a bounded scan keeps a corrupted dev table from turning
// a reset into an unbounded transaction.
const SEED_SCAN_LIMIT = 200;

type DemoProduct = {
	productname: string;
	category: 'onigiri' | 'food' | 'snacks' | 'other';
	price: number;
	helperPrice?: number;
	supplyCost?: number;
	supplier: 'HDJ' | 'Otaku';
	amount: number;
};

const DEMO_PRODUCTS: DemoProduct[] = [
	{
		productname: '[demo] Onigiri Tuna Mayo',
		category: 'onigiri',
		price: 3,
		supplyCost: 1.1,
		supplier: 'HDJ',
		amount: 24,
	},
	{
		// Zero stock on purpose: exercises the out-of-stock POS state.
		productname: '[demo] Onigiri Salmon',
		category: 'onigiri',
		price: 3,
		supplyCost: 1.3,
		supplier: 'HDJ',
		amount: 0,
	},
	{
		productname: '[demo] Ramune',
		category: 'snacks',
		price: 3.5,
		supplyCost: 1.2,
		supplier: 'Otaku',
		amount: 18,
	},
	{
		// Low stock on purpose: exercises the low-stock and quantity-cap states.
		productname: '[demo] Pocky',
		category: 'snacks',
		price: 2.5,
		supplyCost: 0.9,
		supplier: 'Otaku',
		amount: 4,
	},
	{
		productname: '[demo] Takoyaki',
		category: 'food',
		price: 5,
		helperPrice: 4,
		supplyCost: 2.4,
		supplier: 'HDJ',
		amount: 12,
	},
	{
		productname: '[demo] Manga Print',
		category: 'other',
		price: 8,
		supplier: 'Otaku',
		amount: 3,
	},
];

function requireDevTools() {
	if (!isDevToolsEnabled()) {
		throw new Error(
			'Dev tools are disabled. Set ENABLE_DEV_TOOLS=true in .env.local ' +
				'for a non-production site URL (see AGENTS.md, ' +
				'"Verifying signed-in surfaces").',
		);
	}
}

function startOfToday(now: number): number {
	const date = new Date(now);
	date.setHours(0, 0, 0, 0);
	return date.getTime();
}

async function findAuthUserByEmail(
	ctx: QueryCtx,
	email: string,
): Promise<{ id: string } | null> {
	const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
		model: 'user',
		where: [{ field: 'email', value: email }],
	});
	if (!user) return null;
	const id = (user as { _id?: string; id?: string })._id ?? user.id;
	if (!id) return null;
	return { id };
}

/** Look up the seeded operator so a reseed can replace it cleanly. */
export const findDevAuthUser = internalQuery({
	args: { email: v.string() },
	returns: v.union(v.null(), v.object({ id: v.string() })),
	handler: async (ctx, args) => {
		requireDevTools();
		return await findAuthUserByEmail(ctx, args.email);
	},
});

/**
 * Delete an auth user and its rows. Used before re-creating the dev operator
 * so the seeded password is always the one currently in DEV_AUTH_PASSWORD.
 */
async function deleteAuthRowsByUserId<
	M extends 'session' | 'account' | 'passkey',
>(ctx: MutationCtx, model: M, userId: string) {
	let cursor: string | null = null;
	for (;;) {
		const page: { isDone: boolean; continueCursor: string } =
			await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
				input: {
					model,
					where: [{ field: 'userId', value: userId }],
				},
				paginationOpts: { numItems: 100, cursor },
			});
		if (page.isDone) break;
		cursor = page.continueCursor;
	}
}

export const purgeDevAuthUser = internalMutation({
	args: { authId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		requireDevTools();
		await deleteAuthRowsByUserId(ctx, 'session', args.authId);
		await deleteAuthRowsByUserId(ctx, 'account', args.authId);
		await deleteAuthRowsByUserId(ctx, 'passkey', args.authId);
		await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
			input: {
				model: 'user',
				where: [{ field: '_id', value: args.authId }],
			},
		});
		return null;
	},
});

/** Promotes the freshly created operator account and clears the ban. */
export const markDevAuthUserReady = internalMutation({
	args: { authId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		requireDevTools();
		await ctx.runMutation(components.betterAuth.adapter.updateOne, {
			input: {
				model: 'user',
				where: [{ field: '_id', value: args.authId }],
				update: {
					emailVerified: true,
					banned: false,
					banReason: null,
					banExpires: null,
					role: 'admin',
					updatedAt: Date.now(),
				},
			},
		});
		return null;
	},
});

type SeededProduct = Doc<'products'>;

/**
 * Inserts the demo dataset. Idempotent by slug/name/checkoutId: run with
 * `reset: true` (or `bun run seed:dev:reset`) to replace prior demo rows.
 */
export const insertDemoData = internalMutation({
	args: {},
	returns: v.object({
		products: v.number(),
		sales: v.number(),
		submissions: v.number(),
		formSlug: v.string(),
	}),
	handler: async (ctx) => {
		requireDevTools();
		const now = Date.now();

		// Shared onigiri pricing wins over per-product prices at read time, so
		// only create the row when it does not exist; never overwrite an
		// operator's prices.
		const onigiriPricing = await ctx.db
			.query('productCategoryPricing')
			.withIndex('by_category', (q) => q.eq('category', 'onigiri'))
			.first();
		if (!onigiriPricing) {
			await ctx.db.insert('productCategoryPricing', {
				category: 'onigiri',
				price: 3,
				helperPrice: 2.5,
				updatedAt: now,
			});
		}
		// Match the checkout rule: for Onigiri products the shared row wins
		// over per-product prices, including the helper price.
		const sharedOnigiriPricing: {
			price: number;
			helperPrice?: number;
		} = onigiriPricing ?? { price: 3, helperPrice: 2.5 };

		const productsByName = new Map<string, SeededProduct>();
		for (const product of DEMO_PRODUCTS) {
			const existing = await ctx.db
				.query('products')
				.withIndex('by_productname', (q) =>
					q.eq('productname', product.productname),
				)
				.first();
			if (existing) {
				productsByName.set(product.productname, existing);
				continue;
			}
			const id = await ctx.db.insert('products', {
				...product,
				updatedAt: now,
			});
			const created = await ctx.db.get(id);
			if (created) productsByName.set(product.productname, created);
		}

		const requireProduct = (name: string): SeededProduct => {
			const product = productsByName.get(name);
			if (!product) {
				throw new Error(`Demo product ${name} was not created`);
			}
			return product;
		};

		const saleSeeds: {
			daysAgo: number;
			hour: number;
			isHelper: boolean;
			lines: [string, number][];
		}[] = [
			{
				daysAgo: 0,
				hour: 11,
				isHelper: false,
				lines: [
					['[demo] Onigiri Tuna Mayo', 2],
					['[demo] Ramune', 2],
				],
			},
			{
				daysAgo: 1,
				hour: 15,
				isHelper: true,
				lines: [
					['[demo] Takoyaki', 1],
					['[demo] Onigiri Tuna Mayo', 3],
				],
			},
		];

		const today = startOfToday(now);
		let saleCount = 0;
		for (const [index, seed] of saleSeeds.entries()) {
			const checkoutId = `${DEMO_SALE_PREFIX}${index}`;
			const existing = await ctx.db
				.query('sales')
				.withIndex('by_checkoutId', (q) =>
					q.eq('checkoutId', checkoutId),
				)
				.first();
			if (existing) continue;

			const timestamp =
				today - seed.daysAgo * DAY_MS + seed.hour * 3_600_000;
			let totalCents = 0;
			const items = seed.lines.map(([name, quantity]) => {
				const product = requireProduct(name);
				let unitPrice = product.price;
				let helperPrice = product.helperPrice;
				if (product.category === 'onigiri') {
					unitPrice = sharedOnigiriPricing.price;
					helperPrice = sharedOnigiriPricing.helperPrice;
				}
				if (seed.isHelper && helperPrice !== undefined) {
					unitPrice = helperPrice;
				}
				const lineTotal = Math.round(unitPrice * 100) * quantity;
				totalCents += lineTotal;
				return {
					productsId: product._id,
					productName: product.productname,
					unitPrice,
					quantity,
					lineTotal: lineTotal / 100,
				};
			});

			const saleId = await ctx.db.insert('sales', {
				checkoutId,
				operatorName: DEV_OPERATOR_NAME,
				timestamp,
				total: totalCents / 100,
				isHelper: seed.isHelper,
				itemsSnapshot: items,
			});
			for (const item of items) {
				await ctx.db.insert('saleItems', { saleId, ...item });
			}
			saleCount += 1;
		}

		const existingForm = await ctx.db
			.query('preorderForms')
			.withIndex('by_slug', (q) => q.eq('slug', DEMO_FORM_SLUG))
			.first();

		let formId: Id<'preorderForms'>;
		if (existingForm) {
			formId = existingForm._id;
		} else {
			formId = await ctx.db.insert('preorderForms', {
				name: DEMO_FORM_NAME,
				eventDate: now + 14 * DAY_MS,
				closeAt: now + 7 * DAY_MS,
				isActive: true,
				slug: DEMO_FORM_SLUG,
				includeFood: true,
				includeSnacks: true,
				updatedAt: now,
			});
		}

		const formItems = await ctx.db
			.query('preorderFormItems')
			.withIndex('by_formId', (q) => q.eq('formId', formId))
			.take(SEED_SCAN_LIMIT);
		const configuredByProduct = new Map(
			formItems.map((item) => [item.productId, item]),
		);

		if (formItems.length === 0) {
			const sections: [string, 'onigiri' | 'food' | 'snacks'][] = [
				['[demo] Onigiri Tuna Mayo', 'onigiri'],
				['[demo] Onigiri Salmon', 'onigiri'],
				['[demo] Ramune', 'snacks'],
				['[demo] Pocky', 'snacks'],
				['[demo] Takoyaki', 'food'],
			];
			for (const [name, section] of sections) {
				const product = requireProduct(name);
				await ctx.db.insert('preorderFormItems', {
					formId,
					productId: product._id,
					productName: product.productname,
					section,
					...(product.supplyCost === undefined
						? {}
						: { supplyCost: product.supplyCost }),
				});
				await ctx.db.insert('preorderFormTotals', {
					formId,
					productId: product._id,
					quantity: 0,
					updatedAt: now,
				});
				const item = await ctx.db
					.query('preorderFormItems')
					.withIndex('by_formId_and_productId', (q) =>
						q.eq('formId', formId).eq('productId', product._id),
					)
					.first();
				if (item) configuredByProduct.set(product._id, item);
			}
		}

		const submissionSeeds: {
			firstName: string;
			lastName: string;
			isHelper: boolean;
			lines: [string, number][];
		}[] = [
			{
				firstName: 'Aiko',
				lastName: 'Tanaka',
				isHelper: false,
				lines: [
					['[demo] Onigiri Tuna Mayo', 2],
					['[demo] Ramune', 1],
				],
			},
			{
				firstName: 'Ben',
				lastName: 'Okafor',
				isHelper: true,
				lines: [['[demo] Takoyaki', 2]],
			},
		];

		let submissionCount = 0;
		for (const [index, seed] of submissionSeeds.entries()) {
			const submissionToken = `dev-seed-token-${index}`;
			const existing = await ctx.db
				.query('preorderSubmissions')
				.withIndex('by_formId_and_submissionToken', (q) =>
					q
						.eq('formId', formId)
						.eq('submissionToken', submissionToken),
				)
				.first();
			if (existing) continue;

			const submissionId = await ctx.db.insert('preorderSubmissions', {
				formId,
				submissionToken,
				firstName: seed.firstName,
				lastName: seed.lastName,
				isHelper: seed.isHelper,
				confirmed: true,
			});

			const itemsSnapshot: {
				_id: Id<'preorderSubmissionItems'>;
				productName: string;
				quantity: number;
			}[] = [];
			for (const [name, quantity] of seed.lines) {
				const product = requireProduct(name);
				const configured = configuredByProduct.get(product._id);
				if (!configured) continue;
				const itemId = await ctx.db.insert('preorderSubmissionItems', {
					formId,
					submissionId,
					productId: product._id,
					productName: configured.productName,
					section: configured.section,
					quantity,
				});
				itemsSnapshot.push({
					_id: itemId,
					productName: configured.productName,
					quantity,
				});

				const totals = await ctx.db
					.query('preorderFormTotals')
					.withIndex('by_formId_and_productId', (q) =>
						q.eq('formId', formId).eq('productId', product._id),
					)
					.first();
				if (totals) {
					await ctx.db.patch(totals._id, {
						quantity: totals.quantity + quantity,
						updatedAt: now,
					});
				} else {
					await ctx.db.insert('preorderFormTotals', {
						formId,
						productId: product._id,
						quantity,
						updatedAt: now,
					});
				}
			}
			await ctx.db.patch(submissionId, { itemsSnapshot });

			const stats = await ctx.db
				.query('preorderFormStats')
				.withIndex('by_formId', (q) => q.eq('formId', formId))
				.unique();
			if (stats) {
				await ctx.db.patch(stats._id, {
					submissionCount: stats.submissionCount + 1,
				});
			} else {
				await ctx.db.insert('preorderFormStats', {
					formId,
					submissionCount: 1,
				});
			}
			submissionCount += 1;
		}

		return {
			products: productsByName.size,
			sales: saleCount,
			submissions: submissionCount,
			formSlug: DEMO_FORM_SLUG,
		};
	},
});

/** Removes every demo row created by insertDemoData. */
export const clearDemoData = internalMutation({
	args: {},
	returns: v.object({
		products: v.number(),
		sales: v.number(),
		forms: v.number(),
	}),
	handler: async (ctx) => {
		requireDevTools();

		let products = 0;
		const productDocs = await ctx.db
			.query('products')
			.take(SEED_SCAN_LIMIT);
		for (const product of productDocs) {
			if (!product.productname.startsWith(DEMO_PREFIX)) continue;
			await ctx.db.delete(product._id);
			products += 1;
		}

		let sales = 0;
		const saleDocs = await ctx.db
			.query('sales')
			.withIndex('by_timestamp')
			.order('desc')
			.take(SEED_SCAN_LIMIT);
		for (const sale of saleDocs) {
			if (!sale.checkoutId.startsWith(DEMO_SALE_PREFIX)) continue;
			const items = await ctx.db
				.query('saleItems')
				.withIndex('by_saleId', (q) => q.eq('saleId', sale._id))
				.take(SEED_SCAN_LIMIT);
			for (const item of items) await ctx.db.delete(item._id);
			await ctx.db.delete(sale._id);
			sales += 1;
		}

		let forms = 0;
		const form = await ctx.db
			.query('preorderForms')
			.withIndex('by_slug', (q) => q.eq('slug', DEMO_FORM_SLUG))
			.first();
		if (form) {
			const formItems = await ctx.db
				.query('preorderFormItems')
				.withIndex('by_formId', (q) => q.eq('formId', form._id))
				.take(SEED_SCAN_LIMIT * 5);
			for (const row of formItems) await ctx.db.delete(row._id);

			const submissionItems = await ctx.db
				.query('preorderSubmissionItems')
				.withIndex('by_formId', (q) => q.eq('formId', form._id))
				.take(SEED_SCAN_LIMIT * 5);
			for (const row of submissionItems) await ctx.db.delete(row._id);

			const submissions = await ctx.db
				.query('preorderSubmissions')
				.withIndex('by_formId', (q) => q.eq('formId', form._id))
				.take(SEED_SCAN_LIMIT * 5);
			for (const row of submissions) await ctx.db.delete(row._id);

			const totals = await ctx.db
				.query('preorderFormTotals')
				.withIndex('by_formId', (q) => q.eq('formId', form._id))
				.take(SEED_SCAN_LIMIT * 5);
			for (const row of totals) await ctx.db.delete(row._id);

			const windows = await ctx.db
				.query('preorderFormSubmissionWindows')
				.withIndex('by_formId_and_clientId', (q) =>
					q.eq('formId', form._id),
				)
				.take(SEED_SCAN_LIMIT * 5);
			for (const row of windows) await ctx.db.delete(row._id);

			const stats = await ctx.db
				.query('preorderFormStats')
				.withIndex('by_formId', (q) => q.eq('formId', form._id))
				.take(SEED_SCAN_LIMIT);
			for (const row of stats) await ctx.db.delete(row._id);
			await ctx.db.delete(form._id);
			forms += 1;
		}

		return { products, sales, forms };
	},
});

async function ensureDevOperator(ctx: ActionCtx): Promise<string> {
	const email = getDevAuthEmail();
	const password = getDevAuthPassword();

	const existing = await ctx.runQuery(internal.devSeed.findDevAuthUser, {
		email,
	});
	if (existing) {
		// Replace the account so the password always matches the current
		// DEV_AUTH_PASSWORD instead of silently keeping a stale hash.
		await ctx.runMutation(internal.devSeed.purgeDevAuthUser, {
			authId: existing.id,
		});
	}

	const auth = createAuth(ctx);
	const result = await auth.api.signUpEmail({
		body: { email, password, name: DEV_OPERATOR_NAME },
	});
	const authId = result.user?.id;
	if (!authId) {
		throw new Error(
			'Better Auth did not return an id for the dev operator',
		);
	}
	await ctx.runMutation(internal.devSeed.markDevAuthUserReady, { authId });
	return email;
}

/**
 * Entry point: `bun run seed:dev` (or `bun run seed:dev:reset`).
 * Creates the dev operator and demo data on the configured dev deployment.
 */
export const seed = internalAction({
	args: { reset: v.optional(v.boolean()) },
	returns: v.object({
		email: v.string(),
		reset: v.boolean(),
		products: v.number(),
		sales: v.number(),
		submissions: v.number(),
		formSlug: v.string(),
	}),
	handler: async (
		ctx,
		args,
	): Promise<{
		email: string;
		reset: boolean;
		products: number;
		sales: number;
		submissions: number;
		formSlug: string;
	}> => {
		requireDevTools();
		if (args.reset) {
			await ctx.runMutation(internal.devSeed.clearDemoData, {});
		}
		const email = await ensureDevOperator(ctx);
		const data: {
			products: number;
			sales: number;
			submissions: number;
			formSlug: string;
		} = await ctx.runMutation(internal.devSeed.insertDemoData, {});
		return { email, reset: args.reset === true, ...data };
	},
});
