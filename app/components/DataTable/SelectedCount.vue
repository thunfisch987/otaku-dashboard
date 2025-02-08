<template>
	<div
		class="px-4 py-3.5 border-t border-(--ui-border-accented) text-sm text-(--ui-text-muted)"
	>
		{{ table.getFilteredSelectedRowModel().rows.length || 0 }}
		of
		{{ table.getFilteredRowModel().rows.length || 0 }} row(s) selected.
	</div>
</template>

<script setup lang="ts">
import type { ProductSchema } from './types';
import type { Table } from '@tanstack/vue-table';

defineProps<{ table: Table<ProductSchema> }>();
</script>
