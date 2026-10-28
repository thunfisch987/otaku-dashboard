import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/** The three preorder menu sections. Onigiri is always required. */
export const preorderSectionValidator = v.union(
	v.literal('food'),
	v.literal('snacks'),
	v.literal('onigiri'),
);

export const productCategoryValidator = v.union(
	v.literal('onigiri'),
	v.literal('food'),
	v.literal('snacks'),
	v.literal('other'),
);

const applicationTables = {
	products: defineTable({
		productname: v.string(),
		picture: v.optional(v.string()),
		price: v.number(),
		// Optional price used only for helper checkouts at the POS. Never
		// exposed through the public preorder endpoints.
		helperPrice: v.optional(v.number()),
		// Optional while existing inventory products are being categorized.
		category: v.optional(productCategoryValidator),
		supplier: v.union(v.literal('HDJ'), v.literal('Otaku')),
		amount: v.number(),
		updatedAt: v.number(),
	})
		.index('by_productname', ['productname'])
		.index('by_supplier', ['supplier']),

	productCategoryPricing: defineTable({
		category: v.literal('onigiri'),
		price: v.number(),
		helperPrice: v.optional(v.number()),
		updatedAt: v.number(),
	}).index('by_category', ['category']),

	// Legacy table kept for existing data. New preorder functionality lives in
	// the preorder* tables below and never writes sales or stock.
	orders: defineTable({
		orderName: v.string(),
		productsId: v.id('products'),
		amount: v.number(),
		date: v.number(),
	})
		.index('by_product', ['productsId'])
		.index('by_date', ['date']),

	images: defineTable({
		storageId: v.id('_storage'),
		url: v.string(),
	}).index('by_url', ['url']),

	users: defineTable({
		authId: v.string(),
		name: v.string(),
		email: v.string(),
		avatar: v.optional(v.string()),
		avatarStorageId: v.optional(v.id('_storage')),
		avatarCachePendingUrl: v.optional(v.union(v.string(), v.null())),
	})
		.index('by_authId', ['authId'])
		.index('by_name', ['name'])
		.index('by_email', ['email']),

	sales: defineTable({
		checkoutId: v.string(),
		user: v.id('users'),
		operatorName: v.string(),
		timestamp: v.number(),
		total: v.number(),
		// Optional so legacy sales remain readable. New sales always record it.
		isHelper: v.optional(v.boolean()),
	})
		.index('by_checkoutId', ['checkoutId'])
		.index('by_timestamp', ['timestamp']),

	saleItems: defineTable({
		saleId: v.id('sales'),
		productsId: v.id('products'),
		productName: v.string(),
		unitPrice: v.number(),
		quantity: v.number(),
		lineTotal: v.number(),
	}).index('by_saleId', ['saleId']),

	preorderForms: defineTable({
		name: v.string(),
		eventDate: v.number(),
		closeAt: v.union(v.number(), v.null()),
		isActive: v.boolean(),
		slug: v.string(),
		includeFood: v.boolean(),
		includeSnacks: v.boolean(),
		updatedAt: v.number(),
	}).index('by_slug', ['slug']),

	preorderFormItems: defineTable({
		formId: v.id('preorderForms'),
		productId: v.id('products'),
		// Snapshot so historical forms remain readable if a product is renamed.
		productName: v.string(),
		section: preorderSectionValidator,
	})
		.index('by_formId', ['formId'])
		.index('by_formId_and_productId', ['formId', 'productId']),

	preorderSubmissions: defineTable({
		formId: v.id('preorderForms'),
		// Optional to keep any submissions from before idempotency was added readable.
		submissionToken: v.optional(v.string()),
		firstName: v.string(),
		lastName: v.string(),
		isHelper: v.boolean(),
		confirmed: v.boolean(),
	})
		.index('by_formId', ['formId'])
		.index('by_formId_and_submissionToken', ['formId', 'submissionToken']),

	// Updated in the same transaction as each public submission. This bounds
	// anonymous writes without scanning the submissions table.
	preorderFormStats: defineTable({
		formId: v.id('preorderForms'),
		submissionCount: v.number(),
	}).index('by_formId', ['formId']),

	preorderSubmissionItems: defineTable({
		formId: v.id('preorderForms'),
		submissionId: v.id('preorderSubmissions'),
		productId: v.id('products'),
		productName: v.string(),
		section: preorderSectionValidator,
		quantity: v.number(),
	})
		.index('by_submissionId', ['submissionId'])
		.index('by_formId', ['formId'])
		.index('by_formId_and_productId', ['formId', 'productId']),

	// Denormalized preparation counters, written in the same transaction as a
	// submission. Kept out of preorderForms so submissions do not rewrite the
	// form document.
	preorderFormTotals: defineTable({
		formId: v.id('preorderForms'),
		productId: v.id('products'),
		quantity: v.number(),
		updatedAt: v.number(),
	})
		.index('by_formId', ['formId'])
		.index('by_formId_and_productId', ['formId', 'productId']),
};

export default defineSchema({
	...applicationTables,
});
