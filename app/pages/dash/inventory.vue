<template>
	<div class="container py-10 mx-auto">
		<UCard>
			<template #header> Produkte </template>
			<DataTable />
			<UDropdownMenu
				v-model:open="open"
				:items="items"
			>
				<UButton
					variant="outline"
					leading
					:icon="
						open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
					"
					>Export to ...</UButton
				>
			</UDropdownMenu>
		</UCard>
	</div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

const open = useState('dwopdown', () => false);

const items: DropdownMenuItem[] = [
	{
		label: 'csv',
		onSelect() {
			downloadFile();
		},
		icon: 'i-lucide-download',
	},
];

async function downloadFile() {
	const text = await useRequestFetch()('/api/products/export/csv');
	const filename = 'export.csv';
	const element = document.createElement('a');
	element.setAttribute(
		'href',
		'data:text/csv;charset=utf-8,' + encodeURIComponent(text),
	);
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();
	document.body.removeChild(element);
}
</script>
