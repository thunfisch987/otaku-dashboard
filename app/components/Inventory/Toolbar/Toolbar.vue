<template>
	<div
		class="grid gap-3 rounded-xl border border-default bg-elevated/40 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_auto_auto_auto_auto_auto] xl:items-center"
	>
		<UInput
			v-model="globalFilter"
			class="w-full"
			placeholder="Search products…"
			aria-label="Search products"
			icon="i-lucide-search"
			size="lg"
		/>
		<USelect
			v-model="supplierFilter"
			:items="supplierItems"
			class="w-full sm:min-w-40"
			aria-label="Filter by supplier"
			leading-icon="i-lucide-truck"
			size="lg"
		/>
		<USelect
			v-model="categoryFilter"
			:items="categoryItems"
			class="w-full sm:min-w-40"
			aria-label="Filter by category"
			leading-icon="i-lucide-tags"
			size="lg"
		/>
		<USelect
			v-model="stockFilter"
			:items="stockItems"
			class="w-full sm:min-w-44"
			aria-label="Filter by stock status"
			leading-icon="i-lucide-boxes"
			size="lg"
		/>
		<ColumnVisibilityDropdown />
		<div class="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-1">
			<DeleteProductModal />
			<CreateProductModal />
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';
import { productCategories, type ProductSchema } from '../types';
import DeleteProductModal from './DeleteProductModal.vue';
import CreateProductModal from './CreateProductModal.vue';
import ColumnVisibilityDropdown from './ColumnVisibilityDropdown.vue';
import type { SelectItem } from '@nuxt/ui';

const table = useState<{
	tableApi: Table<ProductSchema>;
	tableRef: Ref<HTMLTableElement | null>;
} | null>('table');

const facets = computed(() =>
	table.value?.tableApi.getColumn('supplier')?.getFacetedUniqueValues(),
);
const supplierItems = computed<SelectItem[]>(() => [
	{ label: 'All suppliers', value: 'Alle' },
	{ label: `HDJ (${facets.value?.get('HDJ') ?? 0})`, value: 'HDJ' },
	{ label: `Otaku (${facets.value?.get('Otaku') ?? 0})`, value: 'Otaku' },
]);
const categoryFacets = computed(() =>
	table.value?.tableApi.getColumn('category')?.getFacetedUniqueValues(),
);
const categoryItems = computed<SelectItem[]>(() => [
	{ label: 'All categories', value: 'all' },
	...productCategories.map(({ label, value }) => ({
		label: `${label} (${categoryFacets.value?.get(value) ?? 0})`,
		value,
	})),
]);
const stockItems: SelectItem[] = [
	{ label: 'All stock levels', value: 'all' },
	{ label: 'In stock', value: 'in' },
	{ label: 'Out of stock', value: 'out' },
];

const globalFilter = useState('globalFilter', () => '');
const supplierFilter = useState('facetedSelectValue', () => 'Alle');
const categoryFilter = useState('inventoryCategoryFilter', () => 'all');
const stockFilter = useState('inventoryStockFilter', () => 'all');

watch(
	[supplierFilter, table],
	([value]) => {
		table.value?.tableApi
			.getColumn('supplier')
			?.setFilterValue(value === 'Alle' ? undefined : value);
	},
	{ immediate: true },
);
watch(
	[categoryFilter, table],
	([value]) => {
		table.value?.tableApi
			.getColumn('category')
			?.setFilterValue(value === 'all' ? undefined : value);
	},
	{ immediate: true },
);
watch(
	[stockFilter, table],
	([value]) => {
		table.value?.tableApi
			.getColumn('amount')
			?.setFilterValue(value === 'all' ? undefined : value);
	},
	{ immediate: true },
);
</script>
