<template>
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
						v-maska:unmaskedCreatePriceValue.unmasked="maskOptions"
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
</template>

<script setup lang="ts">
import {
	insertProductSchema,
	type InsertProductSchema,
	type ProductSchema,
} from '../types';
import type { Table } from '@tanstack/vue-table';
import { vMaska } from 'maska/vue';
import type { FormSubmitEvent } from '@nuxt/ui';
import { createProductFetch } from '../fetchcalls';

const maskOptions: MaskInputOptions = {
	eager: true,
	number: {
		unsigned: true,
		fraction: 2,
		locale: 'de-DE',
	},
};

function resetFormState() {
	state.productname = '';
	state.price = '';
	state.supplier = 'Otaku';
	state.amount = 0;
	state.picture = '';
	unmaskedCreatePriceValue.value = '';
}

const form = useTemplateRef('form');
const props = defineProps<{ table: Table<ProductSchema> }>();
const unmaskedCreatePriceValue = useState(
	'unmaskedCreateProductValue',
	() => '',
);
defineExpose({ unmaskedCreatePriceValue });

const createProductOpen = useState('createProductOpen', () => false);
const DEFAULT_STATE = {
	productname: '',
	price: '',
	supplier: 'Otaku',
	amount: 0,
	picture: '',
} as const;
// eslint-disable-next-line prefer-const
let state = reactive<InsertProductSchema>(DEFAULT_STATE);

const items: {
	label: ProductSchema['supplier'];
	value: ProductSchema['supplier'];
}[] = [
	{ label: 'HDJ', value: 'HDJ' },
	{ label: 'Otaku', value: 'Otaku' },
];

async function createProduct(
	formSubmitEvent: FormSubmitEvent<InsertProductSchema>,
) {
	props.table.toggleAllRowsSelected(false);
	const result = await createProductFetch(
		formSubmitEvent,
		unmaskedCreatePriceValue.value,
	);
	if (result === 200) {
		createProductOpen.value = false;
	}
	if (result === 409) {
		form.value?.setErrors([
			{
				name: 'productname',
				message: 'Dieses Produkt existiert bereits',
			},
		]);
	}
	await refreshNuxtData('productFetching');
}
</script>
