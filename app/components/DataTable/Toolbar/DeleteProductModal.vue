<template>
	<UModal
		v-model:open="deleteProductOpen"
		title="Delete selected Product(s)"
		description="This will delete the selected products"
		:ui="{ footer: 'justify-end' }"
	>
		<UButton
			v-if="table"
			label="Delete selected Product(s)"
			color="neutral"
			variant="subtle"
			:disabled="
				table?.tableApi?.getFilteredSelectedRowModel().rows.length < 1
			"
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

const table = useState<{
	tableApi: Table<ProductSchema>;
	tableRef: Ref<HTMLTableElement | null>;
} | null>('table');

const deleteProductOpen = ref<boolean>(false);

const {
	mutate: mutateMany,
	isPending: isPendingMany,
	error: errorMany,
} = useConvexMutation(api.products.removeMany);

function deleteSelected() {
	mutateMany({
		ids:
			table.value?.tableApi
				.getFilteredSelectedRowModel()
				.rows.map((row) => row.original._id as Id<'products'>) ?? [],
	});
	// deleteProductFetch(props.table.getFilteredSelectedRowModel().rows);
	table.value?.tableApi.toggleAllRowsSelected(false);
	deleteProductOpen.value = false;
}
</script>
