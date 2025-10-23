import * as z from 'zod/mini';

export const insertProductSchema = z.object({
	productname: z.string().check(z.minLength(1, 'Please enter a Name')),
	price: z.string().check(z.minLength(1, 'Please enter a price')),
	supplier: z._default(z.enum(['HDJ', 'Otaku']), 'Otaku'),
	amount: z._default(z.int().check(z.nonnegative()), 0),
	picture: z.optional(z.string().check()),
});

export const productSchema = z.extend(insertProductSchema, {
	_id: z.string(),
	price: z.number(),
});

export const patchProductSchema = z.extend(insertProductSchema, {
	_id: z.string(),
});

export type ProductSchema = z.infer<typeof productSchema>;

export const productArraySchema = z.array(productSchema);

export type ProductArraySchema = z.infer<typeof productArraySchema>;

export type InsertProductSchema = z.infer<typeof insertProductSchema>;

export type PatchProductSchema = z.infer<typeof patchProductSchema>;
