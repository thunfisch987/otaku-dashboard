<template>
	<div class="flex space-x-2">
		<UInput
			v-model="globalFilter"
			class="max-w-sm"
			placeholder="Filter..."
		/>
		<ColumnVisibilityDropdown />
		<USelect
			v-model="facetedSelectValue"
			:items="items"
			class="w-36 mr-auto"
		/>
		<DeleteProductModal />
		<CreateProductModal />
		<UKbd>C</UKbd>
	</div>
</template>
<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';
import type { ProductSchema } from '../types';
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

const globalFilter = useState('globalFilter', () => '');

const items = ref<SelectItem[]>([
	{ label: 'Alle Supplier', value: 'Alle' },
	{
		label: 'HDJ',
		value: 'HDJ',
		chip: { text: `${facets.value?.get('HDJ') ?? 0}`, size: '2xl' },
	},
	{
		label: 'Otaku',
		value: 'Otaku',
		chip: { text: `${facets.value?.get('Otaku') ?? 0}`, size: '2xl' },
	},
]);

const facetedSelectValue = useState('facetedSelectValue', () => 'Alle');

watch(facetedSelectValue, (value) => {
	table.value?.tableApi
		.getColumn('supplier')
		?.setFilterValue(value === 'Alle' ? undefined : value);
});
</script>
