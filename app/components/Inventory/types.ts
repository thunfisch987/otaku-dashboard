import * as z from 'zod/mini';

export type ProductCategory = 'onigiri' | 'food' | 'snacks' | 'other';

export const productCategories: {
	label: string;
	value: ProductCategory;
}[] = [
	{ label: 'Onigiri', value: 'onigiri' },
	{ label: 'Food', value: 'food' },
	{ label: 'Snacks', value: 'snacks' },
	{ label: 'Other', value: 'other' },
];

const productCategorySchema = z._default(
	z.enum(['onigiri', 'food', 'snacks', 'other']),
	'other',
);

export const insertProductSchema = z.object({
	productname: z.string().check(z.minLength(1, 'Please enter a Name')),
	price: z
		.string()
		.check(
			z.minLength(1, 'Please enter a price'),
			z.regex(
				/^\d+(?:[.,]\d{0,2})?$/,
				'Enter a valid price with up to two decimal places.',
			),
		),
	category: productCategorySchema,
	supplier: z._default(z.enum(['HDJ', 'Otaku']), 'Otaku'),
	amount: z._default(z.int().check(z.nonnegative()), 0),
	picture: z.optional(z.string().check()),
	helperPrice: z.optional(
		z
			.string()
			.check(
				z.regex(
					/^(?:\d+(?:[.,]\d{0,2})?)?$/,
					'Enter a valid helper price or leave it empty.',
				),
			),
	),
	supplyCost: z.optional(
		z
			.string()
			.check(
				z.regex(
					/^(?:\d+(?:[.,]\d{0,2})?)?$/,
					'Enter a valid supply cost or leave it empty.',
				),
			),
	),
});

export const productSchema = z.extend(insertProductSchema, {
	_id: z.string(),
	price: z.number(),
	category: productCategorySchema,
	helperPrice: z.optional(z.number()),
	supplyCost: z.optional(z.number()),
});

export const patchProductSchema = z.extend(insertProductSchema, {
	_id: z.string(),
});

export type ProductSchema = z.infer<typeof productSchema>;

export const productArraySchema = z.array(productSchema);

export type ProductArraySchema = z.infer<typeof productArraySchema>;

export type InsertProductSchema = z.infer<typeof insertProductSchema>;

export type ProductCreationFormState = Pick<
	InsertProductSchema,
	| 'productname'
	| 'price'
	| 'category'
	| 'supplier'
	| 'amount'
	| 'helperPrice'
	| 'supplyCost'
>;

export type PatchProductSchema = z.infer<typeof patchProductSchema>;

const productMoneyPattern = /^(?:\d+(?:[.,]\d{0,2})?)?$/;

export function parseProductMoney(
	value: string | undefined,
): number | undefined {
	const input = String(value ?? '').trim();
	if (!input || !productMoneyPattern.test(input)) return undefined;
	const amount = Number(input.replace(',', '.'));
	return Number.isFinite(amount) ? amount : undefined;
}
