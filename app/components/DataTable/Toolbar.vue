<template>
	<div class="flex space-x-2">
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
		<UModal
			v-model:open="createProductOpen"
			title="Create Product"
			description="Create a new product"
			:ui="{ footer: 'justify-end' }"
			@update:open="(isOpen) => isOpen && resetFormState()"
		>
			<UButton
				label="Create Product"
				color="neutral"
				variant="subtle"
			/>

			<template #body>
				<UForm
					ref="form"
					:schema="insertProductSchema"
					:state="state"
					class="space-y-4"
					@submit="createProduct"
				>
					<UFormField
						label="ProduktName"
						name="productname"
						required
					>
						<UInput
							v-model="state.productname"
							placeholder="Name des Produkts"
							autocomplete="off"
							autofocus
						/>
					</UFormField>
					<UFormField
						label="Price"
						name="price"
						required
						class=""
					>
						<UInput
							v-model="state.price"
							v-maska:unmaskedValue.unmasked="maskOptions"
							inputmode="numeric"
							trailing-icon="i-lucide-euro"
						/>
					</UFormField>
					<UFormField
						label="Supplier"
						name="supplier"
						required
					>
						<USelect
							v-model="state.supplier"
							:items="items"
						/>
					</UFormField>
					<UFormField
						label="Amount"
						name="amount"
						required
					>
						<UInputNumber
							v-model="state.amount"
							placeholder="Amount"
						/>
					</UFormField>
					<UButton
						label="Confirm"
						color="primary"
						type="submit"
						:disabled="form?.getErrors().length !== 0"
					/>
				</UForm>
			</template>
		</UModal>
	</div>
</template>
<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';
import type { InsertProductSchema, ProductSchema } from './types';
import { insertProductSchema } from './types';
import type { FormSubmitEvent } from '@nuxt/ui';
import { vMaska } from 'maska/vue';
import type { MaskInputOptions } from 'maska';
import { FetchError } from 'ofetch';

const unmaskedValue = ref('');
defineExpose({ unmaskedValue });

const maskOptions: MaskInputOptions = {
	eager: true,
	number: {
		unsigned: true,
		fraction: 2,
		locale: 'de-DE',
	},
};

interface DataTableToolbarProps {
	table: Table<ProductSchema>;
}

const props = defineProps<DataTableToolbarProps>();
const toast = useToast();

const createProductOpen = ref<boolean>(false);
const deleteProductOpen = ref<boolean>(false);
const DEFAULT_STATE = {
	productname: '',
	price: '',
	supplier: 'Otaku',
	amount: 0,
	picture: '',
} as const;
// eslint-disable-next-line prefer-const
let state = reactive<InsertProductSchema>(DEFAULT_STATE);

const form = useTemplateRef('form');
const items = [
	{ label: 'HDJ', value: 'HDJ' },
	{ label: 'Otaku', value: 'Otaku' },
];
async function deleteSelected() {
	for (const row of props.table.getFilteredSelectedRowModel().rows) {
		const data = await useRequestFetch()(
			`/api/products/${row.original.id}`,
			{
				method: 'delete',
			},
		);
		if (data) {
			toast.add({
				title: `Produkt namens ${row.original.productname} gelöscht!`,
				description: 'GELÖSCHT.',
				color: 'error',
			});
		}
	}
	props.table.toggleAllRowsSelected(false);
	deleteProductOpen.value = false;
	await refreshNuxtData('productFetching');
}

async function createProduct(
	formSubmitEvent: FormSubmitEvent<InsertProductSchema>,
) {
	props.table.toggleAllRowsSelected(false);
	try {
		const data = await useRequestFetch()('/api/products', {
			method: 'post',
			body: {
				productname: formSubmitEvent.data.productname,
				price: Number.parseFloat(unmaskedValue.value),
				supplier: formSubmitEvent.data.supplier,
				amount: formSubmitEvent.data.amount,
				picture: formSubmitEvent.data.picture,
			},
		});

		toast.add({
			title: `Produkt namens ${data.productname} erstellt!`,
			color: 'success',
			id: 'modal-success',
		});

		// resetFormState();

		createProductOpen.value = false;
		await refreshNuxtData('productFetching');
	} catch (error) {
		if (error instanceof FetchError) {
			if (
				error.data.statusCode === 409 &&
				error.data.statusMessage === 'Conflict' &&
				error.data.message === 'Product already exists'
			) {
				toast.add({
					title: `Ein Produkt mit dem Namen "${error.data.data.productname}" existiert bereits!`,
					description: 'Bitte wähle einen anderen Namen.',
					color: 'error',
					duration: 0,
					close: { color: 'error', variant: 'outline' },
				});
			}
			form.value?.setErrors([
				{
					name: 'productname',
					message: 'Dieses Produkt existiert bereits',
				},
			]);
		} else {
			console.error(error);
		}
	}
}

function resetFormState() {
	state.productname = '';
	state.price = '';
	state.supplier = 'Otaku';
	state.amount = 0;
	state.picture = '';
	unmaskedValue.value = '';
}
</script>
