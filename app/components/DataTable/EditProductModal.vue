<template>
	<UModal
		v-model:open="editProductOpen"
		title="Produkt bearbeiten"
		description="Bearbeite ein bestehendes Produkt"
		:ui="{ footer: 'justify-end' }"
		@update:open="(isOpen: boolean) => isOpen && resetFormState()"
	>
		<template #body>
			<UForm
				ref="form"
				:schema="patchProductSchema"
				:state="editProductState"
				class="space-y-4"
				@submit="editProduct"
			>
				<UFormField
					label="ProduktName"
					name="productname"
					required
				>
					<UInput
						v-model="editProductState.productname"
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
						v-model="editProductState.price"
						v-maska:unmaskedEditPriceValue.unmasked="maskOptions"
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
						v-model="editProductState.supplier"
						:items="items"
					/>
				</UFormField>
				<UFormField
					label="Amount"
					name="amount"
					required
				>
					<UInputNumber
						v-model="editProductState.amount"
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
import type { MaskInputOptions } from 'maska';
import { resetFormState } from './forms';
import {
	patchProductSchema,
	type PatchProductSchema,
	type ProductSchema,
} from './types';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { Table } from '@tanstack/vue-table';
import { vMaska } from 'maska/vue';
import { api } from '~~/convex/_generated/api';
import type { Id } from '~~/convex/_generated/dataModel';

const props = defineProps<{
	table: Table<ProductSchema>;
	// sendWebsocket: (
	// 	data: string | ArrayBuffer | Blob,
	// 	useBuffer?: boolean,
	// ) => boolean;
}>();

const form = useTemplateRef('form');
const items: {
	label: ProductSchema['supplier'];
	value: ProductSchema['supplier'];
}[] = [
	{ label: 'HDJ', value: 'HDJ' },
	{ label: 'Otaku', value: 'Otaku' },
];

const unmaskedEditPriceValue = useState('unmaskedProductEditValue', () => '');
defineExpose({ unmaskedEditPriceValue });
const maskOptions: MaskInputOptions = {
	eager: true,
	number: {
		unsigned: true,
		fraction: 2,
		locale: 'de-DE',
	},
};
const DEFAULT_STATE = {
	productname: '',
	price: '',
	supplier: 'Otaku',
	amount: 0,
	picture: '',
	_id: '',
} as const;
const editProductOpen = useState('editProductOpen', () => false);
const editProductState = useState<PatchProductSchema>(
	'editProductState',
	() => DEFAULT_STATE,
);

const { mutate } = useConvexMutation(api.products.update);

function editProduct(formSubmitEvent: FormSubmitEvent<PatchProductSchema>) {
	props.table.toggleAllRowsSelected(false);
	mutate({
		id: formSubmitEvent.data._id as Id<'products'>,
		productname: formSubmitEvent.data.productname,
		supplier: formSubmitEvent.data.supplier,
		price: Number.parseFloat(unmaskedEditPriceValue.value),
		amount: formSubmitEvent.data.amount,
		picture: formSubmitEvent.data.picture,
	});
	editProductOpen.value = false;
}
</script>
