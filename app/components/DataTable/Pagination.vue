<template>
	<div class="flex justify-center pt-4">
		<UInputNumber
			v-model="pagination.pageSize"
			:min="0"
			:max="40"
			:step="5"
			@update:model-value="(value) => table.setPageSize(value)"
		/>
		<UPagination
			:default-page="(table.getState().pagination.pageIndex || 0) + 1"
			:items-per-page="table.getState().pagination.pageSize"
			:total="table.getFilteredRowModel().rows.length"
			@update:page="(p) => table.setPageIndex(p - 1)"
		/>
	</div>
</template>

<script setup lang="ts">
import type { ProductSchema } from './types';
import type { Table } from '@tanstack/vue-table';

const pagination = useState<{ pageIndex: number; pageSize: number }>(
	'pagination',
);

defineProps<{ table: Table<ProductSchema> }>();
</script>
