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

const props = defineProps<{
	table: Table<ProductSchema>;
	sendWebsocket: (
		data: string | ArrayBuffer | Blob,
		useBuffer?: boolean,
	) => boolean;
}>();

const deleteProductOpen = ref<boolean>(false);

async function deleteSelected() {
	const result = await deleteProductFetch(
		props.table.getFilteredSelectedRowModel().rows,
	);
	switch (result) {
		case 200:
			props.sendWebsocket('plzrefetchclient');
			break;
		case 409:
			break;
		default:
			break;
	}
	props.table.toggleAllRowsSelected(false);
	deleteProductOpen.value = false;
}
</script>
