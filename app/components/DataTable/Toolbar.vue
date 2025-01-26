<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';
import { toast as sonn } from 'vue-sonner';
import type { z } from 'zod';
import { CirclePlus, Trash2, CircleX } from 'lucide-vue-next';
import { insertProductSchema, suppliers } from './columns';
import type { ProductSchema } from './columns';
import { useToast } from '@/components/ui/toast/use-toast';
import { Toaster } from '@/components/ui/toast';

import { Sonner } from '@/components/ui/sonner';

interface DataTableToolbarProps {
	table: Table<ProductSchema>;
}

const props = defineProps<DataTableToolbarProps>();

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
	props.table.toggleAllRowsSelected(false);
	await refreshNuxtData('productFetching');
}

async function deleteSelected() {
	for (const row of props.table.getFilteredSelectedRowModel().rows) {
		const { status } = await useFetch(`/api/products/${row.original.id}`, { method: 'delete' });
		if (status.value === 'success') {
			sonn.error(`Produkt namens ${row.original.name} gelöscht!`, {
				description: 'GELÖSCHT.',
			});
		}
	}
	props.table.toggleAllRowsSelected(false);
	await refreshNuxtData('productFetching');
}
const isFiltered = computed(() => props.table.getState().columnFilters.length > 0);
</script>

<template>
	<div class="flex items-center justify-between">
		<Toaster />
		<Sonner :visible-toasts="9" />
		<div class="flex flex-1 items-center space-x-2">
			<Input
				class="max-w-sm"
				placeholder="Filter by name"
				:model-value="table.getColumn('name')?.getFilterValue() as string"
				@update:model-value=" table.getColumn('name')?.setFilterValue($event)"
			/>
			<DataTableFacetedFilter
				v-if="table.getColumn('supplier')"
				:column="table.getColumn('supplier')"
				title="Supplier"
				:options="suppliers"
			/>
			<Button
				v-if="isFiltered"
				variant="ghost"
				class="h-8 px-2 lg:px-3"
				@click="table.resetColumnFilters()"
			>
				Reset
				<CircleX class="ml-2 h-4 w-4" />
			</Button>
		</div>
		<div class="flex flex-none justify-end space-x-2">
			<AlertDialog>
				<AlertDialogTrigger as-child>
					<Button :disabled="table.getFilteredSelectedRowModel().rows.length < 1">
						<Trash2 />
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
								<span v-if="row.original.name">{{ row.original?.name }}</span>
								<br>
							</template>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel> Cancel </AlertDialogCancel>
						<AlertDialogAction @click="deleteSelected">
							Confirm
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog>
				<Dialog
					v-model:open="createProductDialogOpen"
				>
					<DialogTrigger as-child>
						<Button>
							<CirclePlus />
							Create Product
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
			</AlertDialog>
		</div>
	</div>
</template>
