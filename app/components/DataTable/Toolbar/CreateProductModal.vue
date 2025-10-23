<template>
	<UModal
		v-model:open="createProductOpen"
		title="Create Product"
		description="Create a new product"
		:ui="{ footer: 'justify-end' }"
		@update:open="(isOpen: boolean) => isOpen && resetFormState()"
	>
		<UButton
			id="createProductButton"
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
import type { MaskInputOptions } from 'maska';
import { api } from '~~/convex/_generated/api';
import { useConvexMutation } from 'convex-vue';

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

const table = useState<{
	tableApi: Table<ProductSchema>;
	tableRef: Ref<HTMLTableElement | null>;
} | null>('table');

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
const toast = useToast();
const { mutate, isPending, error } = useConvexMutation(api.products.create);
function createProduct(formSubmitEvent: FormSubmitEvent<InsertProductSchema>) {
	table.value?.tableApi.toggleAllRowsSelected(false);
	mutate({
		productname: formSubmitEvent.data.productname,
		price: Number.parseFloat(unmaskedCreatePriceValue.value),
		supplier: formSubmitEvent.data.supplier,
		amount: formSubmitEvent.data.amount,
		picture: formSubmitEvent.data.picture,
	});
	createProductOpen.value = false;
	toast.add({
		title: `Produkt namens ${formSubmitEvent.data.productname} erstellt!`,
		color: 'success',
		id: 'modal-success',
	});
}
</script>
