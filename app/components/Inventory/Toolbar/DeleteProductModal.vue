<template>
	<UModal
		v-model:open="deleteProductOpen"
		title="Delete selected products"
		description="This will delete the selected products"
		:ui="{ footer: 'justify-end' }"
	>
		<UButton
			v-if="table"
			label="Delete selected products"
			color="neutral"
			variant="subtle"
			:disabled="
				table?.tableApi?.getFilteredSelectedRowModel().rows.length < 1
			"
			:loading="isPendingMany"
			class="min-h-11"
		/>

		<template #footer>
			<div class="flex flex-wrap justify-end gap-2">
				<UButton
					color="neutral"
					label="Cancel"
					@click="deleteProductOpen = false"
				/>
				<UButton
					label="Confirm"
					color="primary"
					:loading="isPendingMany"
					:disabled="isPendingMany"
					class="min-h-11"
					@click="deleteSelected"
				/>
			</div>
			<UAlert
				v-if="errorMany"
				title="Could not delete selected products"
				:description="
					errorMany instanceof Error
						? errorMany.message
						: 'Please try again.'
				"
				color="error"
				icon="i-lucide-circle-alert"
			/>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import type { Id } from '~~/convex/_generated/dataModel';
import type { ProductSchema } from '../types';
import type { Table } from '@tanstack/vue-table';
import { api } from '#convex/api';

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

async function deleteSelected() {
	try {
		await mutateMany({
			ids:
				table.value?.tableApi
					.getFilteredSelectedRowModel()
					.rows.map((row) => row.original._id as Id<'products'>) ??
				[],
		});
		table.value?.tableApi.toggleAllRowsSelected(false);
		deleteProductOpen.value = false;
	} catch {
		// Keep the confirmation open so the operator can retry.
	}
}
</script>
