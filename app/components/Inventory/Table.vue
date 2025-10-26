<template>
	<div>
		<div class="lg:hidden">
			<h1 class="text-2xl text-center">pls use desktop</h1>
		</div>
		<div
			v-if="parsedAllProducts"
			class="w-full space-y-4 pb-4 flex-col hidden lg:flex"
		>
			<LazyInventoryToolbar :hydrate-when="parsedAllProducts.success" />
			<UTable
				ref="table"
				v-model:pagination="pagination"
				v-model:column-visibility="columnVisibility"
				v-model:global-filter="globalFilter"
				:data="parsedAllProducts.data"
				:columns="columns"
				:loading="pendingos"
				:pagination-options="{
					getPaginationRowModel: getPaginationRowModel(),
				}"
				:faceted-options="{
					getFacetedRowModel: getFacetedRowModel(),
					getFacetedUniqueValues: getFacetedUniqueValues(),
				}"
				class="flex-1"
			/>
			<LazyInventorySelectedCount
				:hydrate-when="parsedAllProducts.success"
			/>
			<LazyInventoryPagination
				v-if="
					table?.tableApi!.getFilteredRowModel()!.rows!.length! >= 5
				"
			/>
			<LazyInventoryEditProductModal
				:hydrate-when="parsedAllProducts.success"
			/>
			<div
				v-if="parsedAllProducts.success"
				class="flex space-x-4"
			>
				<UDropdownMenu
					v-model:open="exportAllOpen"
					:items="itemsAll"
				>
					<UButton
						variant="outline"
						leading
						:icon="
							exportAllOpen
								? 'i-lucide-chevron-up'
								: 'i-lucide-chevron-down'
						"
						class=""
					>
						Export all
					</UButton>
				</UDropdownMenu>
				<UDropdownMenu
					v-model:open="exportFilteredOpen"
					:items="itemsFiltered"
				>
					<UButton
						variant="outline"
						leading
						:disabled="!exportFilteredEnabled"
						:title="!exportFilteredEnabled ? 'Bitte Filtern!' : ''"
						:icon="exportFilteredEnabledIcon"
					>
						Export filtered
					</UButton>
				</UDropdownMenu>
				<UDropdownMenu
					v-model:open="exportSelectedOpen"
					:items="itemsSelected"
				>
					<UButton
						variant="outline"
						leading
						:disabled="
							table?.tableApi.getFilteredSelectedRowModel().rows
								.length === 0 ||
							table?.tableApi.getCoreRowModel().rows.length === 0
						"
						:title="
							table?.tableApi.getFilteredSelectedRowModel().rows
								.length === 0 ||
							table?.tableApi.getCoreRowModel().rows.length === 0
								? 'Mindestens ein Produkt muss ausgewählt sein!'
								: ''
						"
						:icon="
							table?.tableApi.getFilteredSelectedRowModel().rows
								.length === 0
								? 'i-lucide-x'
								: exportSelectedOpen
									? 'i-lucide-chevron-up'
									: 'i-lucide-chevron-down'
						"
						class=""
					>
						Export selected
					</UButton>
				</UDropdownMenu>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { productArraySchema, type ProductSchema } from './types';
import {
	getPaginationRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
} from '@tanstack/vue-table';
import { columns } from './columns';
import type { DropdownMenuItem } from '@nuxt/ui';
import type { Table } from '@tanstack/vue-table';
import { api } from '~~/convex/_generated/api';

const json2csv = (data: ProductSchema[]) => {
	const csv = [
		Object.keys(data[0] ?? {}),
		data.map((item) => Object.values(item).join(',')).join('\n'),
	].join('\n');
	return csv;
};

const toast = useToast();

const exportAllOpen = useState('exportAllOpen', () => false);
const exportFilteredOpen = useState('exportFilteredOpen', () => false);
const exportSelectedOpen = useState('exportSelectedOpen', () => false);

const table = useState<{
	tableApi: Table<ProductSchema>;
	tableRef: Ref<HTMLTableElement | null>;
} | null>('table');

const pagination = useState('pagination', () => ({
	pageIndex: 0,
	pageSize: 200,
}));

const columnVisibility = ref({
	_id: false,
});
const globalFilter = useState<string>('globalFilter');

const facetedSelectValue = useState('facetedSelectValue');

const exportFilteredEnabled = computed((): boolean => {
	if (table.value?.tableApi.getCoreRowModel().rows.length === 0) {
		return false;
	} else {
		if (
			globalFilter.value !== '' ||
			table.value?.tableApi.getColumn('supplier')?.getFilterValue() !==
				undefined
		) {
			return true;
		}
	}
	return false;
});

const exportFilteredEnabledIcon = computed((): string => {
	return !exportFilteredEnabled.value
		? 'i-lucide-x'
		: exportFilteredOpen.value
			? 'i-lucide-chevron-up'
			: 'i-lucide-chevron-down';
});

const itemsAll: DropdownMenuItem[] = [
	{
		label: 'csv',
		onSelect() {
			downloadFile('all');
		},
		icon: 'i-lucide-download',
	},
];

const itemsFiltered: DropdownMenuItem[] = [
	{
		label: 'csv',
		onSelect() {
			downloadFile('filtered');
		},
		icon: 'i-lucide-download',
	},
];

const itemsSelected: DropdownMenuItem[] = [
	{
		label: 'csv',
		onSelect() {
			downloadFile('selected');
		},
		icon: 'i-lucide-download',
	},
];

function getMyRowModel(
	option: 'all' | 'filtered' | 'selected',
	table: Table<ProductSchema>,
) {
	switch (option) {
		case 'all':
			return table.getCoreRowModel().rows.map((row) => row.original);
		case 'filtered':
			return table.getFilteredRowModel().rows.map((row) => row.original);
		case 'selected':
			return table
				.getFilteredSelectedRowModel()
				.rows.map((row) => row.original);
	}
}

async function downloadFile(option: 'all' | 'filtered' | 'selected') {
	if (table.value) {
		if (table.value.tableApi.getCoreRowModel().rows.length > 0) {
			const rows = json2csv(getMyRowModel(option, table.value.tableApi));
			const filename = `export${option === 'filtered' ? `_${globalFilter.value || facetedSelectValue.value}` : ''}.csv`;
			const element = document.createElement('a');
			element.setAttribute(
				'href',
				'data:text/csv;charset=utf-8,' + encodeURIComponent(rows),
			);
			element.setAttribute('download', filename);

			element.style.display = 'none';
			document.body.appendChild(element);

			element.click();
			document.body.removeChild(element);
		} else {
			toast.add({
				title: 'Keine Produkte zum exportieren vorhanden!',
				description:
					'Bitte kreiere oder importiere Produkte um diese zu exportieren.',
				color: 'error',
				duration: 0,
				close: { color: 'error', variant: 'outline' },
				ui: {
					root: 'ring-(--ui-error)',
				},
			});
		}
	}
}

const {
	data: productos,
	isPending: pendingos,
	suspense: sus,
} = useConvexQuery(api.products.list);

sus();

const parsedAllProducts = computed(() =>
	productArraySchema.safeParse(productos.value),
);
</script>
