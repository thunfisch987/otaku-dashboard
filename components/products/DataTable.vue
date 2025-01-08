<script setup lang="ts" generic="TData, TValue">
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/vue-table';

import {
	FlexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useVueTable,
} from '@tanstack/vue-table';

import type { z } from 'zod';
import { toast as sonn } from 'vue-sonner';
import { insertProductSchema, valueUpdater } from './columns';

import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/components/ui/toast/use-toast';

import { Sonner } from '@/components/ui/sonner';

const sorting = useState<SortingState>('sorting', () => []);
const columnFilters = useState<ColumnFiltersState>('columnFilters', () => []);
const rowSelection = useState(() => {});

const props = defineProps<{
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
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

const createProductDialogOpen = useState<boolean>('createProductDialogState', () => false);

const { toast } = useToast();

async function submit(formData: z.infer<typeof insertProductSchema>) {
	createProductDialogOpen.value = false;
	const { error, status } = await useFetch('/api/products', {
		method: 'post',
		body: formData,
	});
	if (status.value === 'error' && error.value && error.value.statusCode === 409) {
		toast({
			title: `Ein Produkt mit dem Namen "${formData.name}" existiert bereits schon!`,
			description: 'Bitte wähle einen anderen Namen.',
			variant: 'destructive',
		});
		return;
	}
	refreshNuxtData('productFetching');
}

async function deleteSelected() {
	for (const row of table.getFilteredSelectedRowModel().rows) {
		const { status } = await useFetch(`/api/products/${row.original.id}`, { method: 'delete' });
		if (status.value === 'success') {
			sonn.error(`Produkt namens ${row.original.name} gelöscht!`, {
				description: 'GELÖSCHT.',
			});
		}
	}
	refreshNuxtData('productFetching');
	// table.getFilteredSelectedRowModel().rows.forEach(async (row) => {
	// 	await useFetch(`/api/products/${row.original.id}`);
	// });
}
</script>

<template>
	<div>
		<Toaster />
		<Sonner :visible-toasts="9" />
		<div class="flex items-center py-4 gap-1">
			<Input
				class="max-w-sm"
				placeholder="Filter Products"
				:model-value="table.getColumn('name')?.getFilterValue() as string"
				@update:model-value=" table.getColumn('name')?.setFilterValue($event)"
			/>
			<AlertDialog>
				<AlertDialogTrigger as-child>
					<Button>
						Delete selected
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure you want to delete these products?</AlertDialogTitle>
						<AlertDialogDescription>
							This will delete:
							<br>
							<template
								v-for="row of table.getFilteredSelectedRowModel().rows"
								:key="row"
							>
								{{ row.original.name }}
								<br>
							</template>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel> Cancel </AlertDialogCancel>
						<AlertDialogAction @click="deleteSelected">
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
				<AlertDialog>
					<Dialog
						v-model:open="createProductDialogOpen"
					>
						<DialogTrigger as-child>
							<Button class="ml-auto">
								Create new Product
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create Product</DialogTitle>
								<DialogDescription>Create a new product</DialogDescription>
							</DialogHeader>
							<AutoForm
								:schema="insertProductSchema"
								@submit="(data) => submit(data)"
							>
								<Button
									type="submit"
									class="mt-2"
								>
									Create Product
								</Button>
							</AutoForm>
						</DialogContent>
					</Dialog>
					<!-- TODO: Faceted Filters -->
				</alertdialog>
			</alertdialog>
		</div>
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
			<ProductsDataTablePagination :table="table" />
			<pre>{{ table.getFilteredSelectedRowModel().rows }}</pre>
		</div>
	</div>
</template>
