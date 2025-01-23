<script setup lang="ts">
import type { ColumnDef, SortingState, ColumnFiltersState, RowSelectionState } from '@tanstack/vue-table';

import {
	FlexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useVueTable,
} from '@tanstack/vue-table';

import { valueUpdater } from './columns';

import type { ProductSchema, ProductArraySchema } from './columns';

const sorting = useState<SortingState>('sorting', () => []);
const columnFilters = useState<ColumnFiltersState>('columnFilters', () => []);
const rowSelection = useState<RowSelectionState>('rowSelection', () => {
	return {};
});

const props = defineProps<{
	columns: ColumnDef<ProductSchema>[];
	data: ProductArraySchema;
	toolbar?: boolean;
	selection?: boolean;
}>();

const table = useVueTable({
	get data() { return props.data; },
	get columns() { return props.columns; },
	getCoreRowModel: getCoreRowModel(),
	getPaginationRowModel: getPaginationRowModel(),
	getSortedRowModel: getSortedRowModel(),
	onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
	onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
	getFilteredRowModel: getFilteredRowModel(),
	onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
	state: {
		get sorting() { return sorting.value; },
		get columnFilters() { return columnFilters.value; },
		get rowSelection() { return rowSelection.value; },
	},
});

if (props.selection === false) {
	table.getColumn('select')?.toggleVisibility(false);
}
</script>

<template>
	<div class="space-y-4">
		<DataTableToolbar
			v-if="toolbar"
			:table="table"
		/>
		<div class="border rounded-md">
			<Table>
				<TableHeader>
					<TableRow
						v-for="headerGroup in table.getHeaderGroups()"
						:key="headerGroup.id"
					>
						<TableHead
							v-for="header in headerGroup.headers"
							:key="header.id"
						>
							<FlexRender
								v-if="!header.isPlaceholder"
								:render="header.column.columnDef.header"
								:props="header.getContext()"
							/>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<template v-if="table.getRowModel().rows?.length">
						<TableRow
							v-for="row in table.getRowModel().rows"
							:key="row.id"
							:data-state="row.getIsSelected() ? 'selected' : undefined"
						>
							<TableCell
								v-for="cell in row.getVisibleCells()"
								:key="cell.id"
							>
								<FlexRender
									:render="cell.column.columnDef.cell"
									:props="cell.getContext()"
								/>
							</TableCell>
						</TableRow>
					</template>
					<template v-else>
						<TableRow>
							<TableCell
								:colspan="columns.length"
								class="h-24 text-center"
							>
								No results.
							</TableCell>
						</TableRow>
					</template>
				</TableBody>
			</Table>
			<DataTablePagination :table="table" />
		</div>
	</div>
</template>
