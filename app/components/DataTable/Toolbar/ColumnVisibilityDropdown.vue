<template>
	<UDropdownMenu
		:items="
			table
				?.getAllColumns()
				.filter((column) => column.getCanHide())
				.map((column) => ({
					label: upperFirst(column.id),
					type: 'checkbox' as const,
					checked: column.getIsVisible(),
					onUpdateChecked(checked: boolean) {
						table.getColumn(column.id)?.toggleVisibility(!!checked);
					},
					onSelect(e?: Event) {
						e?.preventDefault();
					},
				}))
		"
		:content="{ align: 'end' }"
	>
		<UButton
			label="Columns"
			color="neutral"
			variant="outline"
			trailing-icon="i-lucide-chevron-down"
		/>
	</UDropdownMenu>
</template>

<script setup lang="ts">
import type { ProductSchema } from '../types';
import type { Table } from '@tanstack/vue-table';
import { upperFirst } from 'scule';

defineProps<{
	table: Table<ProductSchema>;
}>();
</script>
