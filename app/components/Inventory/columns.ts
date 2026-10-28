import type { TableColumn, DropdownMenuItem } from '@nuxt/ui';
import type { Column, Row } from '@tanstack/vue-table';
import type { ProductSchema } from './types';
import { UButton, UDropdownMenu, UCheckbox, UBadge } from '#components';
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
		class: '-mx-2.5 min-h-11 px-3',
		onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
	});
}

function getRowItems(row: Row<ProductSchema>): DropdownMenuItem[] {
	return [
		{
			label: 'Delete product',
			icon: 'i-lucide-trash',
			onSelect() {
				deleteProduct(row).catch(() => {});
			},
		},
		{
			type: 'separator',
		},
		{
			label: 'Edit product',
			icon: 'i-lucide-pen',
			onSelect() {
				prepareEditForm(row);
			},
		},
	];
}
export const columns: TableColumn<ProductSchema>[] = [
	{
		accessorKey: '_id',
		header: ({ column }) => getSortHeader(column, 'ID'),
		cell: ({ row }) => `#${row.getValue<string>('_id')}`,
		enableHiding: true,
	},
	{
		id: 'select',
		header: ({ table }) =>
			h(UCheckbox, {
				modelValue: table.getIsSomePageRowsSelected()
					? 'indeterminate'
					: table.getIsAllPageRowsSelected(),
				'onUpdate:modelValue': (value) =>
					table.toggleAllPageRowsSelected(!!value),
				ariaLabel: 'Select all',
			}),
		cell: ({ row }) =>
			h(UCheckbox, {
				modelValue: row.getIsSelected(),
				'onUpdate:modelValue': (value) => row.toggleSelected(!!value),
				ariaLabel: 'Select row',
			}),
		enableHiding: false,
	},
	{
		accessorKey: 'productname',
		header: ({ column }) => getSortHeader(column, 'Product name'),
		cell: ({ row }) => row.getValue('productname'),
		enableHiding: false,
	},
	{
		accessorKey: 'category',
		header: ({ column }) => getSortHeader(column, 'Category'),
		cell: ({ row }) => productCategoryLabel(row.original.category),
		enableHiding: false,
	},
	{
		accessorKey: 'price',
		header: ({ column }) => getSortHeader(column, 'Price'),
		cell: ({ row }) =>
			new Intl.NumberFormat('en', {
				style: 'currency',
				currency: 'EUR',
			}).format(Number.parseFloat(row.getValue('price'))),
		enableHiding: false,
	},
	{
		accessorKey: 'helperPrice',
		header: 'Helper price',
		cell: ({ row }) => {
			const price = row.original.helperPrice;
			return price === undefined
				? '—'
				: new Intl.NumberFormat('en', {
						style: 'currency',
						currency: 'EUR',
					}).format(price);
		},
		enableHiding: true,
	},
	{
		accessorKey: 'supplier',
		header: 'Supplier',
		cell: ({ row }) => row.getValue('supplier'),
		enableHiding: false,
	},
	{
		accessorKey: 'amount',
		header: ({ column }) => getSortHeader(column, 'Stock'),
		cell: ({ row }) => {
			const amount = Number(row.getValue('amount'));
			return h(
				UBadge,
				{
					color: amount === 0 ? 'error' : 'success',
					variant: 'subtle',
				},
				() => (amount === 0 ? 'Out of stock' : `${amount} in stock`),
			);
		},
		filterFn: (row, columnId, value: string) => {
			const amount = Number(row.getValue(columnId));
			return (
				value === 'all' || (value === 'out' ? amount === 0 : amount > 0)
			);
		},
		enableHiding: false,
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return h(
				'div',
				{ class: 'text-right' },
				h(
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
							class: 'ml-auto min-h-11 min-w-11',
							'aria-label': `Actions for ${row.original.productname}`,
						}),
				),
			);
		},
		enableHiding: false,
	},
];

function productCategoryLabel(category: ProductSchema['category']) {
	const labels: Record<
		Exclude<ProductSchema['category'], undefined>,
		string
	> = {
		onigiri: 'Onigiri',
		food: 'Food',
		snacks: 'Snacks',
		other: 'Other',
	};
	return (category && labels[category]) ?? '—';
}
