<template>
	<div class="w-full space-y-4 pb-4 flex flex-col">
		<template v-if="table && table?.tableApi !== undefined">
			<DataTableToolbar :table="table?.tableApi!" />
		</template>
		<UTable
			ref="table"
			v-model:pagination="pagination"
			:data="parsedAllProducts.data"
			:columns="columns"
			:loading="status === 'pending'"
			:pagination-options="{
				getPaginationRowModel: getPaginationRowModel(),
			}"
			class="flex-1"
		/>
		<div
			class="px-4 py-3.5 border-t border-(--ui-border-accented) text-sm text-(--ui-text-muted)"
		>
			{{
				table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
			}}
			of
			{{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s)
			selected.
		</div>
		<div class="flex justify-center border-t border-(--ui-border) pt-4">
			<UPagination
				:default-page="
					(table?.tableApi?.getState().pagination.pageIndex || 0) + 1
				"
				:items-per-page="
					table?.tableApi?.getState().pagination.pageSize
				"
				:total="table?.tableApi?.getFilteredRowModel().rows.length"
				@update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui';
import {
	productArraySchema,
	type ProductSchema,
} from '~/components/DataTable/types';
import { getPaginationRowModel, type Row } from '@tanstack/vue-table';
import { DataTableToolbar } from '#components';

const pagination = ref({
	pageIndex: 0,
	pageSize: 5,
});
const table = useTemplateRef('table');
const UButton = resolveComponent('UButton');
const UDropdownMenu = resolveComponent('UDropdownMenu');
const UCheckbox = resolveComponent('UCheckbox');

const { data: allProducts, status } = await useFetch('/api/products', {
	key: 'productFetching',
	lazy: true,
});

const parsedAllProducts = computed(() =>
	productArraySchema.safeParse(allProducts.value),
);

const columns: TableColumn<ProductSchema>[] = [
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
	},
	{
		accessorKey: 'productname',
		header: ({ column }) => {
			const isSorted = column.getIsSorted();

			return h(UButton, {
				color: 'neutral',
				variant: 'ghost',
				label: 'Name',
				icon: isSorted
					? isSorted === 'asc'
						? 'i-lucide-arrow-up-narrow-wide'
						: 'i-lucide-arrow-down-wide-narrow'
					: 'i-lucide-arrow-up-down',
				class: '-mx-2.5',
				onClick: () =>
					column.toggleSorting(column.getIsSorted() === 'asc'),
			});
		},
		cell: ({ row }) => row.getValue('productname'),
	},
	{
		accessorKey: 'price',
		header: ({ column }) => {
			const isSorted = column.getIsSorted();

			return h(UButton, {
				color: 'neutral',
				variant: 'ghost',
				label: 'Price',
				icon: isSorted
					? isSorted === 'asc'
						? 'i-lucide-arrow-up-narrow-wide'
						: 'i-lucide-arrow-down-wide-narrow'
					: 'i-lucide-arrow-up-down',
				class: '-mx-2.5',
				onClick: () =>
					column.toggleSorting(column.getIsSorted() === 'asc'),
			});
		},
		cell: ({ row }) =>
			new Intl.NumberFormat('de-DE', {
				style: 'currency',
				currency: 'EUR',
			}).format(Number.parseFloat(row.getValue('price'))),
	},
	{
		accessorKey: 'supplier',
		header: 'Supplier',
		cell: ({ row }) => row.getValue('supplier'),
	},
	{
		accessorKey: 'amount',
		header: 'Amount',
		cell: ({ row }) => Number.parseInt(row.getValue('amount')),
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
							class: 'ml-auto',
						}),
				),
			);
		},
	},
];

const toast = useToast();

function getRowItems(row: Row<ProductSchema>): DropdownMenuItem[] {
	return [
		{
			type: 'label',
			label: 'Actions',
		},
		{
			label: 'Delete Product',
			icon: 'i-lucide-trash',
			onSelect() {
				navigator.clipboard.writeText(row.original.productname);

				toast.add({
					title: 'Payment ID copied to clipboard!',
					color: 'success',
					icon: 'i-lucide-circle-check',
				});
			},
		},
		{
			type: 'separator',
		},
		{
			label: 'View customer',
		},
		{
			label: 'View payment details',
		},
	];
}
</script>
