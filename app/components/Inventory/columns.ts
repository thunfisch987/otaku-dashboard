import type { TableColumn, DropdownMenuItem } from '@nuxt/ui';
import type { Column, Row } from '@tanstack/vue-table';
import type { ProductSchema } from './types';
import { UButton, UDropdownMenu, UCheckbox, UBadge } from '#components';
import { prepareEditForm } from './forms';
import { formatCurrency, formatOptionalCurrency } from '~/utils/currency';
import { productCategoryLabel, stockSummary } from './format';

type RowActionHandlers = {
	deleteProduct: (product: ProductSchema) => void;
};

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

export function getRowItems(
	row: Row<ProductSchema>,
	actions: RowActionHandlers,
): DropdownMenuItem[] {
	return [
		{
			label: 'Delete product',
			icon: 'i-lucide-trash',
			onSelect() {
				actions.deleteProduct(row.original);
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

function selectColumn(): TableColumn<ProductSchema> {
	return {
		id: 'select',
		header: ({ table }) =>
			h(UCheckbox, {
				modelValue: table.getIsSomePageRowsSelected()
					? 'indeterminate'
					: table.getIsAllPageRowsSelected(),
				'onUpdate:modelValue': (value: unknown) =>
					table.toggleAllPageRowsSelected(!!value),
				ariaLabel: 'Select all',
			}),
		cell: ({ row }) =>
			h(UCheckbox, {
				modelValue: row.getIsSelected(),
				'onUpdate:modelValue': (value: unknown) =>
					row.toggleSelected(!!value),
				ariaLabel: 'Select row',
			}),
		enableHiding: false,
	};
}

function productNameColumn(): TableColumn<ProductSchema> {
	return {
		accessorKey: 'productname',
		header: ({ column }) => getSortHeader(column, 'Product'),
		cell: ({ row }) => {
			const product = row.original;
			const stock = stockSummary(product.amount);
			return h('div', { class: 'min-w-0 whitespace-normal' }, [
				h(
					'p',
					{ class: 'font-medium break-words' },
					product.productname,
				),
				// Phone layout folds the category, price, and stock columns
				// into this cell so the table fits without side-scrolling.
				h(
					'p',
					{ class: 'mt-0.5 text-xs text-muted md:hidden' },
					`${productCategoryLabel(product.category)} · ${formatCurrency(product.price)}`,
				),
				h(
					UBadge,
					{
						color: stock.color,
						variant: 'subtle',
						class: 'mt-1 md:hidden',
					},
					() => stock.label,
				),
			]);
		},
		enableHiding: false,
	};
}

// Columns that move into the product cell (or the edit form) on phones.
const phoneHiddenColumn = {
	class: { th: 'max-md:hidden', td: 'max-md:hidden' },
} satisfies NonNullable<TableColumn<ProductSchema>['meta']>;

function stockColumn(): TableColumn<ProductSchema> {
	return {
		accessorKey: 'amount',
		header: ({ column }) => getSortHeader(column, 'Stock'),
		cell: ({ row }) => {
			const summary = stockSummary(Number(row.getValue('amount')));
			return h(
				UBadge,
				{
					color: summary.color,
					variant: 'subtle',
				},
				() => summary.label,
			);
		},
		meta: phoneHiddenColumn,
		filterFn: (row, columnId, value: string) => {
			const amount = Number(row.getValue(columnId));
			return (
				value === 'all' || (value === 'out' ? amount === 0 : amount > 0)
			);
		},
		enableHiding: false,
	};
}

function actionsColumn(actions: RowActionHandlers): TableColumn<ProductSchema> {
	return {
		id: 'actions',
		cell: ({ row }) => {
			return h(
				'div',
				{ class: 'flex justify-end' },
				h(
					UDropdownMenu,
					{
						content: {
							align: 'end',
						},
						items: getRowItems(row, actions),
					},
					() =>
						h(UButton, {
							icon: 'i-lucide-ellipsis-vertical',
							color: 'neutral',
							variant: 'ghost',
							class: 'ml-auto min-h-11 min-w-11 justify-center',
							'aria-label': `Actions for ${row.original.productname}`,
						}),
				),
			);
		},
		enableHiding: false,
	};
}

export function createColumns(
	actions: RowActionHandlers,
): TableColumn<ProductSchema>[] {
	return [
		{
			accessorKey: '_id',
			header: ({ column }) => getSortHeader(column, 'ID'),
			cell: ({ row }) => `#${row.getValue<string>('_id')}`,
			enableHiding: true,
		},
		selectColumn(),
		productNameColumn(),
		{
			accessorKey: 'category',
			header: ({ column }) => getSortHeader(column, 'Category'),
			cell: ({ row }) => productCategoryLabel(row.original.category),
			meta: phoneHiddenColumn,
			enableHiding: false,
		},
		{
			accessorKey: 'price',
			header: ({ column }) => getSortHeader(column, 'Price'),
			cell: ({ row }) =>
				formatCurrency(Number.parseFloat(row.getValue('price'))),
			meta: phoneHiddenColumn,
			enableHiding: false,
		},
		{
			accessorKey: 'helperPrice',
			header: 'Helper price',
			cell: ({ row }) => formatOptionalCurrency(row.original.helperPrice),
			meta: phoneHiddenColumn,
			enableHiding: true,
		},
		{
			accessorKey: 'supplyCost',
			header: ({ column }) => getSortHeader(column, 'Supply cost'),
			cell: ({ row }) => formatOptionalCurrency(row.original.supplyCost),
			sortUndefined: 'last',
			meta: phoneHiddenColumn,
			enableHiding: true,
		},
		{
			accessorKey: 'supplier',
			header: 'Supplier',
			cell: ({ row }) => row.getValue('supplier'),
			meta: phoneHiddenColumn,
			enableHiding: false,
		},
		stockColumn(),
		actionsColumn(actions),
	];
}
