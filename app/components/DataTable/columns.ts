import type { TableColumn, DropdownMenuItem } from '@nuxt/ui';
import type { Column, Row } from '@tanstack/vue-table';
import { deleteProductFetch } from './fetchcalls';
import type { ProductSchema } from './types';
import { UButton, UDropdownMenu, UCheckbox } from '#components';
import { prepareEditForm } from './forms';

function getSortHeader(column: Column<ProductSchema>, label: string) {
	const isSorted = column.getIsSorted();

	return h(UButton, {
		color: 'neutral',
		variant: 'ghost',
		label: label,
		icon: isSorted
			? isSorted === 'asc'
				? 'i-lucide-arrow-up-narrow-wide'
				: 'i-lucide-arrow-down-wide-narrow'
			: 'i-lucide-arrow-up-down',
		class: '-mx-2.5',
		onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
	});
}

function getRowItems(row: Row<ProductSchema>): DropdownMenuItem[] {
	return [
		{
			label: 'Produkt löschen',
			icon: 'i-lucide-trash',
			onSelect() {
				deleteProductFetch(row);
			},
		},
		{
			type: 'separator',
		},
		{
			label: 'Produkt bearbeiten',
			icon: 'i-lucide-pen',
			onSelect() {
				prepareEditForm(row);
			},
		},
	];
}

export const columns: TableColumn<ProductSchema>[] = [
	{
		accessorKey: 'id',
		header: ({ column }) => getSortHeader(column, 'ID'),
		cell: ({ row }) => `#${row.getValue('id')}`,
		enableHiding: true,
	},
	{
		id: 'select',
		header: ({ table }) =>
			h(UCheckbox, {
				modelValue: table.getIsSomePageRowsSelected()
					? 'indeterminate'
					: table.getIsAllPageRowsSelected(),
				'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
					table.toggleAllPageRowsSelected(!!value),
				ariaLabel: 'Select all',
			}),
		cell: ({ row }) =>
			h(UCheckbox, {
				modelValue: row.getIsSelected(),
				'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
					row.toggleSelected(!!value),
				ariaLabel: 'Select row',
			}),
		enableHiding: false,
	},
	{
		accessorKey: 'productname',
		header: ({ column }) => getSortHeader(column, 'Produktname'),
		cell: ({ row }) => row.getValue('productname'),
		enableHiding: false,
	},
	{
		accessorKey: 'price',
		header: ({ column }) => getSortHeader(column, 'Preis'),
		cell: ({ row }) =>
			new Intl.NumberFormat('de-DE', {
				style: 'currency',
				currency: 'EUR',
			}).format(Number.parseFloat(row.getValue('price'))),
		enableHiding: false,
	},
	{
		accessorKey: 'supplier',
		header: 'Supplier',
		cell: ({ row }) => row.getValue('supplier'),
		enableHiding: false,
	},
	{
		accessorKey: 'amount',
		header: ({ column }) => getSortHeader(column, 'Menge'),
		cell: ({ row }) => Number.parseInt(row.getValue('amount')),
		enableHiding: false,
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return h(
				'div',
				{ class: 'text-right' },
				h(
					// @ts-expect-error It throws an TS error but in the runtime it works completely fine
					UDropdownMenu,
					{
						content: {
							align: 'end',
						},
						items: getRowItems(row),
					},
					() =>
						h(UButton, {
							icon: 'i-lucide-ellipsis-vertical',
							color: 'neutral',
							variant: 'ghost',
							class: 'ml-auto',
						}),
				),
			);
		},
		enableHiding: false,
	},
];
