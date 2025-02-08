<template>
	<div class="flex space-x-2">
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

defineProps<{
	table: Table<ProductSchema>;
}>();
</script>
