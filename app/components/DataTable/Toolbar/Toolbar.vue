<template>
	<div class="flex space-x-2">
		<UInput
			v-model="globalFilter"
			class="max-w-sm"
			placeholder="Filter..."
		/>
		<ColumnVisibilityDropdown
			:table="table"
			class="mr-auto"
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

const globalFilter = useState('globalFilter', () => '');

const isFetching = useState('isFetching', () => false);

function timeout(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function refreshStuff() {
	isFetching.value = true;
	await refreshNuxtData('productFetching');
	await timeout(3000);
	isFetching.value = false;
}

defineProps<{
	table: Table<ProductSchema>;
}>();
</script>
