<template>
	<div class="flex space-x-2">
		<UInput
			v-model="globalFilter"
			class="max-w-sm"
			placeholder="Filter..."
		/>
		<ColumnVisibilityDropdown :table="table" />
		<USelect
			v-model="facetedSelectValue"
			:items="items"
			class="w-36 mr-auto"
		/>
		<UButton
			icon="i-lucide-refresh-ccw"
			:loading="isFetching"
			@click="refreshStuff"
			>Refresh</UButton
		>
		<DeleteProductModal :table="table" />
		<CreateProductModal :table="table" />
	</div>
</template>
<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';
import type { ProductSchema } from '../types';
import DeleteProductModal from './DeleteProductModal.vue';
import CreateProductModal from './CreateProductModal.vue';
import ColumnVisibilityDropdown from './ColumnVisibilityDropdown.vue';
import type { SelectItem } from '@nuxt/ui';

const props = defineProps<{
	table: Table<ProductSchema>;
}>();

const facets = computed(() =>
	props.table.getColumn('supplier')?.getFacetedUniqueValues(),
);

const globalFilter = useState('globalFilter', () => '');

const isFetching = useState('isFetching', () => false);

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

function timeout(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

watch(facetedSelectValue, (value) => {
	props.table
		.getColumn('supplier')
		?.setFilterValue(value === 'Alle' ? undefined : value);
});

async function refreshStuff() {
	isFetching.value = true;
	await refreshNuxtData('productFetching');
	await timeout(3000);
	isFetching.value = false;
}
</script>
