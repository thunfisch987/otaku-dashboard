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
			:loading="isPendingMany"
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
import type { Id } from '~~/convex/_generated/dataModel';
import type { ProductSchema } from '../types';
import type { Table } from '@tanstack/vue-table';
import { api } from '~~/convex/_generated/api';

const props = defineProps<{
	table: Table<ProductSchema>;
	// sendWebsocket: (
	// 	data: string | ArrayBuffer | Blob,
	// 	useBuffer?: boolean,
	// ) => boolean;
}>();

const deleteProductOpen = ref<boolean>(false);

const { mutate, isPending, error } = useConvexMutation(api.products.remove);
const {
	mutate: mutateMany,
	isPending: isPendingMany,
	error: errorMany,
} = useConvexMutation(api.products.removeMany);
function deleteSelected() {
	// for (const row of props.table.getFilteredSelectedRowModel().rows) {
	// 	mutate({ id: row.original._id as Id<'products'> });
	// }
	mutateMany({
		ids: props.table
			.getFilteredSelectedRowModel()
			.rows.map((row) => row.original._id as Id<'products'>),
	});
	// deleteProductFetch(props.table.getFilteredSelectedRowModel().rows);
	props.table.toggleAllRowsSelected(false);
	deleteProductOpen.value = false;
}
</script>
