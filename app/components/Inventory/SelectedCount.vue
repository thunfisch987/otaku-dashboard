<template>
	<div class="px-4 py-3.5 border-t border-accented text-sm text-muted">
		{{
			table?.tableApi.getFilteredSelectedRowModel().rows.length ?? 'Error'
		}}
		of
		{{ table?.tableApi.getFilteredRowModel().rows.length ?? 'Error' }}
		row(s) selected.
	</div>
</template>

<script setup lang="ts">
import type { ProductSchema } from './types';
import type { Table } from '@tanstack/vue-table';
import type { Ref } from 'vue';

const table = useState<{
	tableApi: Table<ProductSchema>;
	tableRef: Ref<HTMLTableElement | null>;
} | null>('table');
</script>
