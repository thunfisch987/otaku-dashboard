<template>
	<div>
		<div class="w-full space-y-4 pb-4 flex-col">
			<LazyInventoryToolbar />
			<UTable
				ref="table"
				v-model:pagination="pagination"
				v-model:column-visibility="columnVisibility"
				v-model:global-filter="globalFilter"
				:data="tableProducts"
				:columns="columns"
				:loading="pendingos || convexAuthLoading"
				:pagination-options="{
					getPaginationRowModel: getPaginationRowModel(),
				}"
				:faceted-options="{
					getFacetedRowModel: getFacetedRowModel(),
					getFacetedUniqueValues: getFacetedUniqueValues(),
				}"
				class="flex-1"
			/>
			<div
				v-if="convexAuthLoading"
				class="px-4 py-3.5 border-t border-accented text-sm text-muted"
			>
				Waiting for authentication…
			</div>
			<div
				v-else-if="!convexAuthenticated"
				class="px-4 py-3.5 border-t border-accented text-sm text-muted"
			>
				Not authenticated with Convex. Please sign in again.
			</div>
			<div
				v-else-if="!pendingos && !parsedAllProducts.success"
				class="px-4 py-3.5 border-t border-error text-sm text-error"
			>
				Could not read the product data.
			</div>
			<LazyInventorySelectedCount />
			<LazyInventoryPagination
				v-if="
					table?.tableApi!.getFilteredRowModel()!.rows!.length! >= 5
				"
			/>
			<LazyInventoryEditProductModal />
			<div class="flex space-x-4">
				<UDropdownMenu
					v-model:open="exportAllOpen"
					:items="itemsAll"
				>
					<UButton
						variant="outline"
						leading
						:icon="
							exportAllOpen
								? 'i-lucide-chevron-up'
								: 'i-lucide-chevron-down'
						"
						class=""
					>
						Export all
					</UButton>
				</UDropdownMenu>
				<UDropdownMenu
					v-model:open="exportFilteredOpen"
					:items="itemsFiltered"
				>
					<UButton
						variant="outline"
						leading
						:disabled="!exportFilteredEnabled"
						:title="!exportFilteredEnabled ? 'Bitte Filtern!' : ''"
						:icon="exportFilteredEnabledIcon"
					>
						Export filtered
					</UButton>
				</UDropdownMenu>
				<UDropdownMenu
					v-model:open="exportSelectedOpen"
					:items="itemsSelected"
				>
					<UButton
						variant="outline"
						leading
						:disabled="
							table?.tableApi.getFilteredSelectedRowModel().rows
								.length === 0 ||
							table?.tableApi.getCoreRowModel().rows.length === 0
						"
						:title="
							table?.tableApi.getFilteredSelectedRowModel().rows
								.length === 0 ||
							table?.tableApi.getCoreRowModel().rows.length === 0
								? 'Mindestens ein Produkt muss ausgewählt sein!'
								: ''
						"
						:icon="
							table?.tableApi.getFilteredSelectedRowModel().rows
								.length === 0
								? 'i-lucide-x'
								: exportSelectedOpen
									? 'i-lucide-chevron-up'
									: 'i-lucide-chevron-down'
						"
						class=""
					>
						Export selected
					</UButton>
				</UDropdownMenu>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { productArraySchema, type ProductSchema } from './types';
import {
	getPaginationRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
} from '@tanstack/vue-table';
import { columns } from './columns';
import type { DropdownMenuItem } from '@nuxt/ui';
import type { Table } from '@tanstack/vue-table';
import { api } from '#convex/api';

const json2csv = (data: ProductSchema[]) => {
	const csv = [
		Object.keys(data[0] ?? {}),
		data.map((item) => Object.values(item).join(',')).join('\n'),
	].join('\n');
	return csv;
};

const toast = useToast();

const exportAllOpen = useState('exportAllOpen', () => false);
const exportFilteredOpen = useState('exportFilteredOpen', () => false);
const exportSelectedOpen = useState('exportSelectedOpen', () => false);

const table = useState<{
	tableApi: Table<ProductSchema>;
	tableRef: Ref<HTMLTableElement | null>;
} | null>('table');

const pagination = useState('pagination', () => ({
	pageIndex: 0,
	pageSize: 200,
}));

const columnVisibility = ref({
	_id: false,
});
const globalFilter = useState<string>('globalFilter');

const facetedSelectValue = useState('facetedSelectValue');

const exportFilteredEnabled = computed((): boolean => {
	if (table.value?.tableApi.getCoreRowModel().rows.length === 0) {
		return false;
	} else {
		if (
			globalFilter.value !== '' ||
			table.value?.tableApi.getColumn('supplier')?.getFilterValue() !==
				undefined
		) {
			return true;
		}
	}
	return false;
});

const exportFilteredEnabledIcon = computed((): string => {
	return !exportFilteredEnabled.value
		? 'i-lucide-x'
		: exportFilteredOpen.value
			? 'i-lucide-chevron-up'
			: 'i-lucide-chevron-down';
});

const itemsAll: DropdownMenuItem[] = [
	{
		label: 'csv',
		onSelect() {
			downloadFile('all');
		},
		icon: 'i-lucide-download',
	},
];

const itemsFiltered: DropdownMenuItem[] = [
	{
		label: 'csv',
		onSelect() {
			downloadFile('filtered');
		},
		icon: 'i-lucide-download',
	},
];

const itemsSelected: DropdownMenuItem[] = [
	{
		label: 'csv',
		onSelect() {
			downloadFile('selected');
		},
		icon: 'i-lucide-download',
	},
];

const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useConvexAuth();
const productsQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);

function getMyRowModel(
	option: 'all' | 'filtered' | 'selected',
	table: Table<ProductSchema>,
) {
	switch (option) {
		case 'all':
			return table.getCoreRowModel().rows.map((row) => row.original);
		case 'filtered':
			return table.getFilteredRowModel().rows.map((row) => row.original);
		case 'selected':
			return table
				.getFilteredSelectedRowModel()
				.rows.map((row) => row.original);
	}
}

async function downloadFile(option: 'all' | 'filtered' | 'selected') {
	if (table.value) {
		if (table.value.tableApi.getCoreRowModel().rows.length > 0) {
			const rows = json2csv(getMyRowModel(option, table.value.tableApi));
			const filename = `export${option === 'filtered' ? `_${globalFilter.value || facetedSelectValue.value}` : ''}.csv`;
			const element = document.createElement('a');
			element.setAttribute(
				'href',
				'data:text/csv;charset=utf-8,' + encodeURIComponent(rows),
			);
			element.setAttribute('download', filename);

			element.style.display = 'none';
			document.body.appendChild(element);

			element.click();
			document.body.removeChild(element);
		} else {
			toast.add({
				title: 'Keine Produkte zum exportieren vorhanden!',
				description:
					'Bitte kreiere oder importiere Produkte um diese zu exportieren.',
				color: 'error',
				duration: 0,
				close: { color: 'error', variant: 'outline' },
				ui: {
					root: 'ring-(--ui-error)',
				},
			});
		}
	}
}

const {
	data: productos,
	isPending: pendingos,
	suspense: sus,
} = useConvexQuery(api.products.list, productsQueryArgs, { server: false });

sus();

const parsedAllProducts = computed(() =>
	productArraySchema.safeParse(productos.value),
);
const tableProducts = computed(() =>
	parsedAllProducts.value.success ? parsedAllProducts.value.data : [],
);
</script>
