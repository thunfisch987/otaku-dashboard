<template>
	<div v-if="table && table?.tableApi !== undefined">
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
</template>

<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';
import type { ProductSchema } from '../types';
import type { DropdownMenuItem } from '@nuxt/ui';

const toast = useToast();

defineProps<{ parsedAllProducts: ProductSchema[] }>();

const table = useState<{
	tableApi: Table<ProductSchema>;
	tableRef: Ref<HTMLTableElement | null>;
} | null>('table');

const exportAllOpen = useState('exportAllOpen', () => false);
const exportSelectedOpen = useState('exportSelectedOpen', () => false);
const exportFilteredOpen = useState('exportFilteredOpen', () => false);
const globalFilter = useState<string>('globalFilter');

const exportFilteredEnabledIcon = computed((): string => {
	return !exportFilteredEnabled.value
		? 'i-lucide-x'
		: exportFilteredOpen.value
			? 'i-lucide-chevron-up'
			: 'i-lucide-chevron-down';
});

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

const facetedSelectValue = useState('facetedSelectValue');

function getMyRowModel(
	option: 'all' | 'filtered' | 'selected',
	table: Table<ProductSchema>,
): ProductSchema[] {
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
			const rows = getMyRowModel(option, table.value.tableApi);

			const yeet = [
				Object.keys(rows[0] ?? {}),
				...rows.map((it) => Object.values(it)),
			].join('\n');
			const filename = `export${option === 'filtered' ? `_${globalFilter.value || facetedSelectValue.value}` : ''}.csv`;
			const element = document.createElement('a');
			element.setAttribute(
				'href',
				'data:text/csv;charset=utf-8,' + encodeURIComponent(yeet),
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
</script>
