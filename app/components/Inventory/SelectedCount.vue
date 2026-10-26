<template>
	<div
		class="border-t border-accented px-4 py-3.5 text-sm text-muted"
		aria-live="polite"
	>
		{{ table?.tableApi.getFilteredSelectedRowModel().rows.length ?? 0 }}
		selected of
		{{ table?.tableApi.getFilteredRowModel().rows.length ?? 0 }}
		products.
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
