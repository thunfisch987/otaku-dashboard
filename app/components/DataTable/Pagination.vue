<template>
	<div class="flex justify-center pt-4">
		<UInputNumber
			v-model="pagination.pageSize"
			:min="0"
			:max="40"
			:step="5"
			@update:model-value="(value) => table?.tableApi.setPageSize(value)"
		/>
		<UPagination
			:default-page="
				(table?.tableApi.getState().pagination.pageIndex || 0) + 1
			"
			:items-per-page="table?.tableApi.getState().pagination.pageSize"
			:total="table?.tableApi.getFilteredRowModel().rows.length"
			@update:page="(p) => table?.tableApi.setPageIndex(p - 1)"
		/>
	</div>
</template>

<script setup lang="ts">
import type { ProductSchema } from './types';
import type { Table } from '@tanstack/vue-table';

const pagination = useState<{ pageIndex: number; pageSize: number }>(
	'pagination',
);

const table = useState<{
	tableApi: Table<ProductSchema>;
	tableRef: Ref<HTMLTableElement | null>;
} | null>('table');
</script>
