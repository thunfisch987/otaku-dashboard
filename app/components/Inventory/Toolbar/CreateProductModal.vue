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
			class="min-h-11"
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
					label="Product name"
					name="productname"
					required
				>
					<UInput
						v-model="state.productname"
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
						v-model="state.category"
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
						v-model="state.price"
						v-maska:unmaskedCreatePriceValue.unmasked="maskOptions"
						inputmode="numeric"
						trailing-icon="i-lucide-euro"
						:disabled="
							state.category === 'onigiri' && !!onigiriPricing
						"
					/>
				</UFormField>
				<UFormField
					label="Helper price"
					name="helperPrice"
					hint="Optional. Helper checkouts use the regular price when this is empty."
				>
					<UInput
						v-model="state.helperPrice"
						type="number"
						min="0"
						step="0.01"
						placeholder="Use regular price"
						:disabled="
							state.category === 'onigiri' && !!onigiriPricing
						"
					/>
				</UFormField>
				<p
					v-if="state.category === 'onigiri'"
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
					label="Create product"
					color="primary"
					type="submit"
					:loading="isPending"
					:disabled="isPending || form?.getErrors().length !== 0"
					class="min-h-11"
				/>
				<UAlert
					v-if="error"
					title="Could not create product"
					:description="
						error instanceof Error
							? error.message
							: 'Please try again.'
					"
					color="error"
					icon="i-lucide-circle-alert"
				/>
			</UForm>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import {
	insertProductSchema,
	productCategories,
	type InsertProductSchema,
	type ProductSchema,
} from '../types';
import type { Table } from '@tanstack/vue-table';
import { vMaska } from 'maska/vue';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { MaskInputOptions } from 'maska';
import { api } from '#convex/api';

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
	state.category = 'other';
	state.supplier = 'Otaku';
	state.amount = 0;
	state.picture = '';
	state.helperPrice = '';
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
	category: 'other',
	supplier: 'Otaku',
	amount: 0,
	picture: '',
	helperPrice: '',
} as const;

const state = reactive<InsertProductSchema>(DEFAULT_STATE);

watch(
	() =>
		[
			state.category,
			onigiriPricing.value?.price,
			onigiriPricing.value?.helperPrice,
		] as const,
	([category, sharedPrice, sharedHelperPrice]) => {
		if (category !== 'onigiri' || sharedPrice === undefined) return;
		state.price = new Intl.NumberFormat('de-DE', {
			minimumFractionDigits: 2,
		}).format(sharedPrice);
		unmaskedCreatePriceValue.value = String(sharedPrice);
		state.helperPrice =
			sharedHelperPrice === undefined ? '' : String(sharedHelperPrice);
	},
);

const items: {
	label: ProductSchema['supplier'];
	value: ProductSchema['supplier'];
}[] = [
	{ label: 'HDJ', value: 'HDJ' },
	{ label: 'Otaku', value: 'Otaku' },
];
const toast = useToast();
const { mutate, isPending, error } = useConvexMutation(api.products.create);
async function createProduct(
	formSubmitEvent: FormSubmitEvent<InsertProductSchema>,
) {
	try {
		await mutate({
			productname: formSubmitEvent.data.productname,
			price: Number.parseFloat(unmaskedCreatePriceValue.value),
			category: formSubmitEvent.data.category,
			...(String(formSubmitEvent.data.helperPrice ?? '').trim()
				? {
						helperPrice: Number(
							String(formSubmitEvent.data.helperPrice).replace(
								',',
								'.',
							),
						),
					}
				: {}),
			supplier: formSubmitEvent.data.supplier,
			amount: formSubmitEvent.data.amount,
			picture: formSubmitEvent.data.picture,
		});
		table.value?.tableApi.toggleAllRowsSelected(false);
		createProductOpen.value = false;
		toast.add({
			title: `${formSubmitEvent.data.productname} created`,
			color: 'success',
			id: 'modal-success',
		});
	} catch {
		// Keep the form open so the operator can correct or retry.
	}
}
</script>
