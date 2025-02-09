<template>
	<div class="flex space-x-2">
		<UInput
			v-model="globalFilter"
			class="max-w-sm mr-auto"
			placeholder="Filter..."
		/>
		<DeleteProductModal :table="table" />
		<CreateProductModal :table="table" />
		<ColumnVisibilityDropdown :table="table" />
	</div>
</template>
<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';
import type { ProductSchema } from '../types';
import DeleteProductModal from './DeleteProductModal.vue';
import CreateProductModal from './CreateProductModal.vue';
import ColumnVisibilityDropdown from './ColumnVisibilityDropdown.vue';

const globalFilter = useState('globalFilter', () => '');

defineProps<{
	table: Table<ProductSchema>;
}>();
</script>
