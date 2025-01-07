import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';
import { z } from 'zod';
// @ts-expect-error ignore import type problems
import DropdownAction from '@/components/products/DataTableDropdown';

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
		header: () => h('div', { class: 'text-left' }, 'Name'),
		cell: ({ row }) => {
			const name = String(row.getValue('name'));
			return h('div', { class: 'text-left font-medium' }, name);
		},
	},
	{
		accessorKey: 'price',
		header: () => h('div', { class: 'text-left' }, 'Price'),
		cell: ({ row }) => {
			const price = Number.parseInt(row.getValue('price'));
			const formatted = new Intl.NumberFormat('de-DE', {
				style: 'currency',
				currency: 'EUR',
			}).format(price / 100);
			return h('div', { class: 'text-left font-medium' }, formatted);
		},
	},
	{
		accessorKey: 'supplier',
		header: () => h('div', { class: 'text-left' }, 'Supplier'),
		cell: ({ row }) => {
			const supplier = String(row.getValue('supplier'));
			return h('div', { class: 'text-left font-medium' }, supplier);
		},
	},
	{
		accessorKey: 'picture',
		header: () => h('div', { class: 'text-left' }, 'Picture'),
		cell: ({ row }) => {
			const picture = String(row.getValue('picture'));
			return h('div', { class: 'text-left font-medium' }, picture);
		},
	},
	{
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => {
			const product = row.original;
			return h('div', { class: 'relative' }, h(DropdownAction, { product }));
		},
	},
];
