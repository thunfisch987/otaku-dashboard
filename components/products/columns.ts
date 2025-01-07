import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';
import { z } from 'zod';

export const insertProductSchema = z.object({
	name: z.string(),
	price: z.number().nonnegative().finite().safe().default(0),
	supplier: z.enum(['HDJ', 'Otaku']),
	picture: z
		.string()
		.optional()
		.nullable(),
});

export const productSchema = insertProductSchema.extend({
	id: z.number(),
});

export type ProductSchema = z.infer<typeof productSchema>;

export const productArraySchema = z.array(productSchema);

export type ProductArraySchema = z.infer<typeof productArraySchema>;

export type InsertProductSchema = z.infer<typeof insertProductSchema>;

export const columns: ColumnDef<ProductSchema>[] = [
	{
		accessorKey: 'name',
		header: () => h('div', { class: 'text-right' }, 'Name'),
		cell: ({ row }) => {
			const name = String(row.getValue('name'));
			return h('div', { class: 'text-right font-medium' }, name);
		},
	},
	{
		accessorKey: 'price',
		header: () => h('div', { class: 'text-right' }, 'Price'),
		cell: ({ row }) => {
			const price = Number.parseInt(row.getValue('price'));
			const formatted = new Intl.NumberFormat('de-DE', {
				style: 'currency',
				currency: 'EUR',
			}).format(price / 100);
			return h('div', { class: 'text-right font-medium' }, formatted);
		},
	},
	{
		accessorKey: 'supplier',
		header: () => h('div', { class: 'text-right' }, 'Supplier'),
		cell: ({ row }) => {
			const supplier = String(row.getValue('supplier'));
			return h('div', { class: 'text-right font-medium' }, supplier);
		},
	},
	{
		accessorKey: 'picture',
		header: () => h('div', { class: 'text-right' }, 'Picture'),
		cell: ({ row }) => {
			const picture = String(row.getValue('picture'));
			return h('div', { class: 'text-right font-medium' }, picture);
		},
	},
];
