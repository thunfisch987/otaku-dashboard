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
				<UDropdownMenu
					v-model:open="openAll"
					:items="itemsAll"
				>
					<UButton
						variant="outline"
						leading
						:disabled="
							table?.tableApi.getCoreRowModel().rows.length === 0
						"
						:icon="
							openAll
								? 'i-lucide-chevron-up'
								: 'i-lucide-chevron-down'
						"
						>Export all</UButton
					>
				</UDropdownMenu>
				<UDropdownMenu
					v-model:open="openFiltered"
					:items="itemsFiltered"
				>
					<UButton
						variant="outline"
						leading
						:disabled="
							table?.tableApi.getCoreRowModel().rows.length ===
								0 && globalFilter === ''
						"
						:icon="
							globalFilter === 'i-lucide-x'
								? 'i-lucide-'
								: openFiltered
									? 'i-lucide-chevron-up'
									: 'i-lucide-chevron-down'
						"
						>Export filtered</UButton
					>
				</UDropdownMenu>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	productArraySchema,
	type ProductArraySchema,
} from '~/components/DataTable/types';
import { getPaginationRowModel } from '@tanstack/vue-table';
import { columns } from './columns';
import type { DropdownMenuItem } from '@nuxt/ui';
import { json2csv } from 'json-2-csv';

const openAll = useState('openAll', () => false);
const openFiltered = useState('openFiltered', () => false);

const itemsAll: DropdownMenuItem[] = [
	{
		label: 'csv',
		onSelect() {
			downloadFile();
		},
		icon: 'i-lucide-download',
	},
];

const itemsFiltered: DropdownMenuItem[] = [
	{
		label: 'csv',
		onSelect() {
			downloadFile(true);
		},
		icon: 'i-lucide-download',
	},
];

async function downloadFile(filtered: false | true = false) {
	const rows = json2csv(
		filtered
			? table.value?.tableApi
					?.getFilteredRowModel()
					.rows.map((row) => row.original)
			: table.value?.tableApi
					?.getCoreRowModel()
					.rows.map((row) => row.original),
	);
	const filename = `export${filtered ? `_${globalFilter.value}` : ''}.csv`;
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
