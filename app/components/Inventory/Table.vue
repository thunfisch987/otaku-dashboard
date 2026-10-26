<template>
	<div>
		<div class="flex w-full flex-col gap-4 pb-4">
			<LazyInventoryToolbar />
			<div
				class="max-w-full overflow-x-auto rounded-lg border border-default"
			>
				<UTable
					ref="table"
					v-model:pagination="pagination"
					v-model:column-visibility="columnVisibility"
					v-model:global-filter="globalFilter"
					:data="tableProducts"
					:columns="columns"
					:loading="pendingos || convexAuthLoading"
					:pagination-options="{
						getPaginationRowModel: getPaginationRowModel(),
					}"
					:faceted-options="{
						getFacetedRowModel: getFacetedRowModel(),
						getFacetedUniqueValues: getFacetedUniqueValues(),
					}"
					class="min-w-[42rem]"
				/>
			</div>
			<div
				v-if="
					!pendingos &&
					!productsError &&
					parsedAllProducts.success &&
					tableProducts.length === 0
				"
				class="rounded-xl border border-dashed border-default p-6 text-center"
			>
				<UIcon
					name="i-lucide-package-open"
					class="mx-auto size-8 text-muted"
				/>
				<p class="mt-2 font-medium">No products yet</p>
				<p class="mt-1 text-sm text-muted">
					Create a product to start tracking stock.
				</p>
			</div>
			<div
				v-else-if="
					!pendingos &&
					tableProducts.length > 0 &&
					filteredProductCount === 0
				"
				class="rounded-xl border border-dashed border-default p-6 text-center"
			>
				<UIcon
					name="i-lucide-search-x"
					class="mx-auto size-8 text-muted"
				/>
				<p class="mt-2 font-medium">No products match these filters</p>
				<p class="mt-1 text-sm text-muted">
					Clear the search or choose a different stock or supplier
					filter.
				</p>
			</div>
			<div
				v-if="
					convexAuthenticated &&
					!pendingos &&
					!productsError &&
					!productsDone
				"
				class="flex justify-center py-4"
			>
				<UButton
					variant="subtle"
					icon="i-lucide-chevrons-down"
					:loading="loadingMoreProducts"
					:disabled="loadingMoreProducts"
					@click="loadMoreProducts"
				>
					Load more products
				</UButton>
			</div>
			<div
				v-if="convexAuthLoading"
				class="px-4 py-3.5 border-t border-accented text-sm text-muted"
			>
				Waiting for sign-in…
			</div>
			<div
				v-else-if="!convexAuthenticated"
				class="px-4 py-3.5 border-t border-accented text-sm text-muted"
			>
				Not connected to inventory data. Please sign in again.
			</div>
			<div
				v-else-if="!pendingos && productsError"
				class="px-4 py-3.5 border-t border-error text-sm text-error"
			>
				Could not load product data. Check your connection and try
				again.
			</div>
			<div
				v-else-if="!pendingos && !parsedAllProducts.success"
				class="px-4 py-3.5 border-t border-error text-sm text-error"
			>
				Could not read product data. Please refresh or contact support.
			</div>
			<LazyInventorySelectedCount />
			<LazyInventoryPagination
				v-if="
					table?.tableApi!.getFilteredRowModel()!.rows!.length! >= 5
				"
			/>
			<LazyInventoryEditProductModal />
			<div class="flex flex-wrap gap-2">
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
						class="min-h-11"
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
						:title="
							!exportFilteredEnabled ? 'Apply a filter first' : ''
						"
						:icon="exportFilteredEnabledIcon"
						class="min-h-11"
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
							selectedRowCount === 0 || productRowCount === 0
						"
						:title="
							selectedRowCount === 0 || productRowCount === 0
								? 'Select at least one product first'
								: ''
						"
						:icon="
							selectedRowCount === 0
								? 'i-lucide-x'
								: exportSelectedOpen
									? 'i-lucide-chevron-up'
									: 'i-lucide-chevron-down'
						"
						class="min-h-11"
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
import { api } from '#convex/api';

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

const productRowCount = computed(
	() => table.value?.tableApi.getCoreRowModel().rows.length ?? 0,
);
const selectedRowCount = computed(
	() => table.value?.tableApi.getFilteredSelectedRowModel().rows.length ?? 0,
);

const pagination = useState('pagination', () => ({
	pageIndex: 0,
	pageSize: 200,
}));

const columnVisibility = ref({
	_id: false,
});
const globalFilter = useState<string>('globalFilter');

const facetedSelectValue = useState('facetedSelectValue');
const stockFilter = useState('inventoryStockFilter', () => 'all');

const exportFilteredEnabled = computed((): boolean => {
	if (table.value?.tableApi.getCoreRowModel().rows.length === 0) {
		return false;
	} else {
		if (
			globalFilter.value !== '' ||
			table.value?.tableApi.getColumn('supplier')?.getFilterValue() !==
				undefined ||
			table.value?.tableApi.getColumn('amount')?.getFilterValue() !==
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

const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useAppConvexAuth();
const productsQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);

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
			const filterName =
				globalFilter.value ||
				(stockFilter.value !== 'all' ? stockFilter.value : '') ||
				(facetedSelectValue.value !== 'Alle'
					? facetedSelectValue.value
					: '');
			const filename = `export${option === 'filtered' ? `_${filterName || 'filtered'}` : ''}.csv`;
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
				title: 'No products available to export',
				description: 'Create or import products before exporting.',
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
	error: productsError,
	isDone: productsDone,
	isLoadingMore: loadingMoreProducts,
	loadMore: loadMoreProducts,
	suspense: sus,
} = useConvexPaginatedQuery(api.products.list, productsQueryArgs, {
	numItems: 200,
});

sus();

const parsedAllProducts = computed(() =>
	productArraySchema.safeParse(productos.value),
);
const tableProducts = computed(() =>
	parsedAllProducts.value.success ? parsedAllProducts.value.data : [],
);
const filteredProductCount = computed(
	() => table.value?.tableApi.getFilteredRowModel().rows.length ?? 0,
);
</script>
