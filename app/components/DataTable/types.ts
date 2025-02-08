import * as z from 'zod';

export const insertProductSchema = z.object({
	productname: z.string().min(1, 'Please enter a Name'),
	price: z.string().min(1, 'Please enter a price'),
	supplier: z.enum(['HDJ', 'Otaku']).default('Otaku'),
	amount: z.number().nonnegative().finite().safe().default(0),
	picture: z.string().optional().nullable(),
});

export const productSchema = insertProductSchema.extend({
	id: z.number(),
	price: z.number(),
});

export type ProductSchema = z.infer<typeof productSchema>;

export const productArraySchema = z.array(productSchema);

export type ProductArraySchema = z.infer<typeof productArraySchema>;

export type InsertProductSchema = z.input<typeof insertProductSchema>;
