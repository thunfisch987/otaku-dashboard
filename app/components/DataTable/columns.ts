import { h } from 'vue';
import type { ColumnDef, Updater, Column } from '@tanstack/vue-table';
import { ArrowUpDown, ChevronDown, ChevronUp, House, Bird } from 'lucide-vue-next';
import { z } from 'zod';

import type { Ref } from 'vue';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
// @ts-expect-error ignore import type problems
import DropdownAction from '@/components/DataTable/Dropdown';

export const suppliers = [
	{
		value: 'HDJ',
		label: 'HDJ',
		icon: h(House),
	},
	{
		value: 'Otaku',
		label: 'Otaku',
		icon: h(Bird),
	},
];

export function valueUpdater<T extends Updater<unknown>>(updaterOrValue: T, reff: Ref) {
	reff.value = typeof updaterOrValue === 'function'
		? updaterOrValue(reff.value)
		: updaterOrValue;
}

export const insertProductSchema = z.object({
	name: z.string(),
	price: z.number().nonnegative().finite().safe().default(0),
	supplier: z.enum(['HDJ', 'Otaku']),
	amount: z.number().nonnegative().finite().safe().default(0),
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

function sortIcon(column: Column<ProductSchema>) {
	if (column.getIsSorted() === 'asc') {
		return h(ChevronDown, { class: 'ml-2 h-4 w-4' });
	} else if (column.getIsSorted() === 'desc') {
		return h(ChevronUp, { class: 'ml-2 h-4 w-4' });
	} else {
		return h(ArrowUpDown, { class: 'ml-2 h-4 w-4' });
	}
}

export const columns: ColumnDef<ProductSchema>[] = [
	{
		id: 'select',
		header: ({ table }) => h(Checkbox, {
			checked: table.getIsAllPageRowsSelected(),
			'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
			ariaLabel: 'Select all',
		}),
		cell: ({ row }) => h(Checkbox, {
			checked: row.getIsSelected(),
			'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
			ariaLabel: 'Select row',
		}),
		enableSorting: false,
		enableHiding: true,
	},
	{
		accessorKey: 'name',
		header: ({ column }) => {
			return h(Button, {
				variant: 'ghost',
				onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			}, () => ['Name', sortIcon(column)]);
		},
		cell: ({ row }) => {
			const name = String(row.getValue('name'));
			return h('div', { class: 'text-left font-medium' }, name);
		},
	},
	{
		accessorKey: 'price',
		header: ({ column }) => {
			return h(Button, {
				variant: 'ghost',
				onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			}, () => ['Price', sortIcon(column)]);
		},
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
		header: ({ column }) => {
			return h(Button, {
				variant: 'ghost',
				onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			}, () => ['Supplier', sortIcon(column)]);
		},
		cell: ({ row }) => {
			const supplier = String(row.getValue('supplier'));
			return h('div', { class: 'text-left font-medium' }, supplier);
		},
	},
	{ accessorKey: 'amount',
		header: ({ column }) => {
			return h(Button, {
				variant: 'ghost',
				onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			}, () => ['Amount', sortIcon(column)]);
		},
		cell: ({ row }) => {
			const amount = Number.parseInt(row.getValue('amount'));
			return h('div', { class: 'text-left font-medium' }, amount);
		} },
	{
		accessorKey: 'picture',
		header: () => h('div', { class: 'text-left' }, 'Picture'),
		cell: ({ row }) => {
			const _picture = String(row.getValue('picture') ?? '');
			// if (picture) return h(Avatar, () => [
			// 	// h(AvatarImage, { src: picture }),
			// 	h(AvatarFallback, 'X'),
			// ],
			// );
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
