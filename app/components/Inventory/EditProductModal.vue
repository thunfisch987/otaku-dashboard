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
					label="Category"
					name="category"
					required
				>
					<USelect
						v-model="editProductState.category"
						:items="productCategories"
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
						:disabled="
							editProductState.category === 'onigiri' &&
							!!onigiriPricing
						"
					/>
				</UFormField>
				<UFormField
					label="Helper price"
					name="helperPrice"
					hint="Optional. Helper checkouts use the regular price when this is empty."
				>
					<UInput
						v-model="editProductState.helperPrice"
						type="number"
						min="0"
						step="0.01"
						placeholder="Use regular price"
						:disabled="
							editProductState.category === 'onigiri' &&
							!!onigiriPricing
						"
					/>
				</UFormField>
				<p
					v-if="editProductState.category === 'onigiri'"
					class="text-sm text-muted"
				>
					{{
						onigiriPricing
							? 'Onigiri prices are shared across all products in this category.'
							: 'These prices will initialize the shared Onigiri prices.'
					}}
				</p>
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
	productCategories,
	type PatchProductSchema,
	type ProductSchema,
} from './types';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { Table } from '@tanstack/vue-table';
import type { Ref } from 'vue';
import { vMaska } from 'maska/vue';
import { api } from '#convex/api';
import type { Id } from '~~/convex/_generated/dataModel';

const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useAppConvexAuth();
const onigiriPricingArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);
const { data: onigiriPricing } = useConvexQuery(
	api.products.getOnigiriPricing,
	onigiriPricingArgs,
	{ server: false },
);

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
		locale: 'en-US',
	},
};
const DEFAULT_STATE = {
	productname: '',
	price: '',
	supplier: 'Otaku',
	amount: 0,
	picture: '',
	_id: '',
	category: 'other',
} as const;
const editProductOpen = useState('editProductOpen', () => false);
const editProductState = useState<PatchProductSchema>(
	'editProductState',
	() => DEFAULT_STATE,
);

watch(
	() =>
		[
			editProductState.value.category,
			onigiriPricing.value?.price,
			onigiriPricing.value?.helperPrice,
		] as const,
	([category, sharedPrice, sharedHelperPrice]) => {
		if (category !== 'onigiri' || sharedPrice === undefined) return;
		editProductState.value.price = sharedPrice.toFixed(2);
		unmaskedEditPriceValue.value = String(sharedPrice);
		editProductState.value.helperPrice =
			sharedHelperPrice === undefined ? '' : String(sharedHelperPrice);
	},
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
			category: formSubmitEvent.data.category,
			helperPrice: String(editProductState.value.helperPrice ?? '').trim()
				? Number(
						String(editProductState.value.helperPrice).replace(
							',',
							'.',
						),
					)
				: null,
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
