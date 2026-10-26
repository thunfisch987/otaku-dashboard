<template>
	<UModal
		v-model:open="editProductOpen"
		title="Edit product"
		description="Update product details and stock quantity."
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
					label="Product name"
					name="productname"
					required
				>
					<UInput
						v-model="editProductState.productname"
						placeholder="Product name"
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
					label="Stock quantity"
					name="amount"
					required
				>
					<UInputNumber
						v-model="editProductState.amount"
						placeholder="Stock quantity"
						:min="0"
					/>
				</UFormField>
				<UAlert
					v-if="mutationError"
					title="Could not save product changes"
					:description="mutationError"
					color="error"
					icon="i-lucide-circle-alert"
				/>
				<UButton
					label="Save changes"
					color="primary"
					type="submit"
					:loading="isPending"
					:disabled="isPending || form?.getErrors().length !== 0"
					class="min-h-11"
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
import type { Ref } from 'vue';
import { vMaska } from 'maska/vue';
import { api } from '#convex/api';
import type { Id } from '~~/convex/_generated/dataModel';

const table = useState<{
	tableApi: Table<ProductSchema>;
	tableRef: Ref<HTMLTableElement | null>;
} | null>('table');

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

const toast = useToast();
const { mutate, isPending, error } = useConvexMutation(api.products.update);
const mutationError = computed(() =>
	error.value instanceof Error ? error.value.message : undefined,
);

async function editProduct(
	formSubmitEvent: FormSubmitEvent<PatchProductSchema>,
) {
	try {
		await mutate({
			id: formSubmitEvent.data._id as Id<'products'>,
			productname: formSubmitEvent.data.productname,
			supplier: formSubmitEvent.data.supplier,
			price: Number.parseFloat(unmaskedEditPriceValue.value),
			amount: formSubmitEvent.data.amount,
			picture: formSubmitEvent.data.picture,
		});
		table.value?.tableApi.toggleAllRowsSelected(false);
		editProductOpen.value = false;
		toast.add({ title: 'Product updated', color: 'success' });
	} catch {
		// Keep the form open so the operator can review the entered stock value.
	}
}
</script>
