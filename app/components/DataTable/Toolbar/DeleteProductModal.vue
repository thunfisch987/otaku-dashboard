<template>
	<UModal
		v-model:open="deleteProductOpen"
		title="Delete selected Product(s)"
		description="This will delete the selected products"
		:ui="{ footer: 'justify-end' }"
	>
		<UButton
			label="Delete selected Product(s)"
			color="neutral"
			variant="subtle"
			:disabled="table.getFilteredSelectedRowModel().rows.length < 1"
		/>

		<template #footer>
			<div class="flex gap-2">
				<UButton
					color="neutral"
					label="Cancel"
					@click="deleteProductOpen = false"
				/>
				<UButton
					label="Confirm"
					color="primary"
					@click="deleteSelected"
				/>
			</div>
		</template>
	</UModal>
</template>
<script setup lang="ts">
import { deleteProductFetch } from '../fetchcalls';
import type { ProductSchema } from '../types';
import type { Table } from '@tanstack/vue-table';

const props = defineProps<{ table: Table<ProductSchema> }>();

const deleteProductOpen = ref<boolean>(false);

async function deleteSelected() {
	for (const row of props.table.getFilteredSelectedRowModel().rows) {
		await deleteProductFetch(row);
	}
	props.table.toggleAllRowsSelected(false);
	deleteProductOpen.value = false;
}
</script>
