<template>
	<UModal
		v-model:open="createProductOpen"
		title="Create Product"
		:ui="{ footer: 'justify-end' }"
		@update:open="(isOpen: boolean) => isOpen && resetFormState()"
	>
		<UButton
			id="createProductButton"
			label="Create Product"
			icon="i-lucide-package-plus"
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
				<InventoryProductFormFields
					v-model:state="state"
					:onigiri-pricing="onigiriPricing"
					form-validation
					show-supply-cost
				/>
				<UButton
					label="Create product"
					color="primary"
					type="submit"
					:loading="isPending"
					:disabled="isPending || (form?.getErrors().length ?? 0) > 0"
					class="min-h-11"
				/>
				<UAlert
					v-if="creationError"
					:title="
						validationError
							? 'Check the product details'
							: 'Could not create product'
					"
					:description="creationError"
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
	parseProductMoney,
	type InsertProductSchema,
	type ProductSchema,
} from '../types';
import type { Table } from '@tanstack/vue-table';
import type { FormSubmitEvent } from '@nuxt/ui';
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

const form = useTemplateRef('form');
const table = useState<{
	tableApi: Table<ProductSchema>;
	tableRef: Ref<HTMLTableElement | null>;
} | null>('table');

const createProductOpen = useState('createProductOpen', () => false);
const state = reactive<InsertProductSchema>({
	productname: '',
	price: '',
	category: 'other',
	supplier: 'Otaku',
	amount: 0,
	picture: '',
	helperPrice: '',
	supplyCost: '',
});

function resetFormState() {
	state.productname = '';
	state.price = '';
	state.category = 'other';
	state.supplier = 'Otaku';
	state.amount = 0;
	state.picture = '';
	state.helperPrice = '';
	state.supplyCost = '';
	validationError.value = null;
}

const toast = useToast();
const { mutate, isPending, error } = useConvexMutation(api.products.create);
const validationError = ref<string | null>(null);
const creationError = computed(
	() => validationError.value ?? error.value?.message ?? null,
);

async function createProduct(
	formSubmitEvent: FormSubmitEvent<InsertProductSchema>,
) {
	validationError.value = null;
	const price = parseProductMoney(formSubmitEvent.data.price);
	if (price === undefined) {
		validationError.value =
			'Enter a valid price with up to two decimal places.';
		return;
	}

	const helperPriceInput = String(
		formSubmitEvent.data.helperPrice ?? '',
	).trim();
	const helperPrice = helperPriceInput
		? parseProductMoney(helperPriceInput)
		: undefined;
	if (helperPriceInput && helperPrice === undefined) {
		validationError.value = 'Enter a valid helper price or leave it empty.';
		return;
	}
	if (helperPrice !== undefined && helperPrice > price) {
		validationError.value =
			'The helper price cannot be higher than the regular price.';
		return;
	}

	const supplyCostInput = String(
		formSubmitEvent.data.supplyCost ?? '',
	).trim();
	const supplyCost = supplyCostInput
		? parseProductMoney(supplyCostInput)
		: undefined;
	if (supplyCostInput && supplyCost === undefined) {
		validationError.value = 'Enter a valid supply cost or leave it empty.';
		return;
	}

	try {
		await mutate({
			productname: formSubmitEvent.data.productname,
			price,
			category: formSubmitEvent.data.category,
			...(helperPrice === undefined ? {} : { helperPrice }),
			supplier: formSubmitEvent.data.supplier,
			amount: formSubmitEvent.data.amount,
			...(supplyCost === undefined ? {} : { supplyCost }),
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
