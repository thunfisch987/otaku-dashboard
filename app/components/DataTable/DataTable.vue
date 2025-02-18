<template>
	<div>
		<div class="w-full space-y-4 pb-4 flex flex-col">
			<template v-if="table && table?.tableApi !== undefined">
				<LazyDataTableToolbar :table="table?.tableApi!" />
			</template>
			<UTable
				ref="table"
				v-model:pagination="pagination"
				v-model:column-visibility="columnVisibility"
				v-model:global-filter="globalFilter"
				:data="parsedAllProducts.data"
				:columns="columns"
				:loading="status === 'pending'"
				:pagination-options="{
					getPaginationRowModel: getPaginationRowModel(),
				}"
				class="flex-1"
			/>
			<template v-if="table && table?.tableApi !== undefined">
				<LazyDataTableSelectedCount :table="table?.tableApi!" />
				<LazyDataTablePagination :table="table?.tableApi!" />
				<LazyDataTableEditProductModal :table="table?.tableApi!" />
				<div class="flex space-x-4">
					<UDropdownMenu
						v-model:open="openAll"
						:items="itemsAll"
					>
						<UButton
							variant="outline"
							leading
							:disabled="
								table?.tableApi.getCoreRowModel().rows
									.length === 0
							"
							:icon="
								openAll
									? 'i-lucide-chevron-up'
									: 'i-lucide-chevron-down'
							"
							class=""
						>
							Export all
						</UButton>
					</UDropdownMenu>
					<UDropdownMenu
						v-model:open="openFiltered"
						:items="itemsFiltered"
					>
						<UButton
							variant="outline"
							leading
							:disabled="
								globalFilter === '' ||
								table?.tableApi.getCoreRowModel().rows
									.length === 0
							"
							:icon="
								globalFilter === ''
									? 'i-lucide-x'
									: openFiltered
										? 'i-lucide-chevron-up'
										: 'i-lucide-chevron-down'
							"
							class=""
						>
							Export filtered
						</UButton>
					</UDropdownMenu>
					<UDropdownMenu
						v-model:open="openSelected"
						:items="itemsSelected"
					>
						<UButton
							variant="outline"
							leading
							:disabled="
								table?.tableApi.getFilteredSelectedRowModel()
									.rows.length === 0 ||
								table?.tableApi.getCoreRowModel().rows
									.length === 0
							"
							:icon="
								table?.tableApi.getFilteredSelectedRowModel()
									.rows.length === 0
									? 'i-lucide-x'
									: openSelected
										? 'i-lucide-chevron-up'
										: 'i-lucide-chevron-down'
							"
							class=""
						>
							Export selected
						</UButton>
					</UDropdownMenu>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	productArraySchema,
	type ProductSchema,
} from '~/components/DataTable/types';
import { getPaginationRowModel } from '@tanstack/vue-table';
import { columns } from './columns';
import type { DropdownMenuItem } from '@nuxt/ui';
import { json2csv } from 'json-2-csv';
import type { Table } from '@tanstack/vue-table';

const openAll = useState('openAll', () => false);
const openFiltered = useState('openFiltered', () => false);
const openSelected = useState('openSelected', () => false);

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

function getRowModel(
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
		const rows = json2csv(getRowModel(option, table.value.tableApi));
		const filename = `export${option === 'filtered' ? `_${globalFilter.value}` : ''}.csv`;
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
	}
}

// table stuff
const table = useTemplateRef('table');
const pagination = ref({
	pageIndex: 0,
	pageSize: 5,
});
const columnVisibility = ref({
	id: false,
});
const globalFilter = useState<string>('globalFilter');

// -------------------fetch Products and parse them with zod-------------------
const { data: allProducts, status } = await useFetch('/api/products', {
	key: 'productFetching',
	lazy: true,
});
const parsedAllProducts = computed(() =>
	productArraySchema.safeParse(allProducts.value),
);
</script>
