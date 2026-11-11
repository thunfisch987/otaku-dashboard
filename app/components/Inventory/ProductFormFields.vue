<template>
	<div class="space-y-3">
		<div :class="compact ? 'grid gap-3 md:grid-cols-6' : 'space-y-4'">
			<UFormField
				label="Product name"
				:name="formValidation ? 'productname' : undefined"
				required
				:class="compact ? 'md:col-span-2' : undefined"
			>
				<UInput
					v-model="state.productname"
					class="w-full"
					placeholder="Product name"
					autocomplete="off"
				/>
			</UFormField>
			<UFormField
				label="Category"
				:name="formValidation ? 'category' : undefined"
				required
			>
				<USelect
					v-model="state.category"
					:items="productCategories"
					class="w-full"
				/>
			</UFormField>
			<UFormField
				label="Regular price (€)"
				:name="formValidation ? 'price' : undefined"
				required
				hint="Use a period or comma for cents."
			>
				<UInput
					v-model="state.price"
					inputmode="decimal"
					placeholder="0.00"
					trailing-icon="i-lucide-euro"
					:disabled="sharedOnigiriPriceAvailable"
				/>
			</UFormField>
			<UFormField
				label="Supplier"
				:name="formValidation ? 'supplier' : undefined"
				required
			>
				<USelect
					v-model="state.supplier"
					:items="supplierOptions"
					class="w-full"
				/>
			</UFormField>
			<UFormField
				label="Initial stock"
				:name="formValidation ? 'amount' : undefined"
				required
				hint="Whole items in stock."
			>
				<UInputNumber
					v-model="state.amount"
					:min="0"
					:step="1"
				/>
			</UFormField>
		</div>

		<div
			:class="
				compact
					? 'flex flex-col gap-3 sm:flex-row sm:items-end'
					: 'space-y-4'
			"
		>
			<UFormField
				label="Helper price (€)"
				:name="formValidation ? 'helperPrice' : undefined"
				hint="Optional. Helper checkouts use the regular price when empty."
				:class="compact ? 'w-full sm:max-w-xs' : undefined"
			>
				<UInput
					v-model="state.helperPrice"
					inputmode="decimal"
					placeholder="Use regular price"
					trailing-icon="i-lucide-euro"
					:disabled="sharedOnigiriPriceAvailable"
				/>
			</UFormField>
			<UFormField
				v-if="showSupplyCost"
				label="Supply cost per item (€)"
				:name="formValidation ? 'supplyCost' : undefined"
				hint="Optional; used for preparation cost estimates."
			>
				<UInput
					v-model="state.supplyCost"
					inputmode="decimal"
					placeholder="Unknown"
					trailing-icon="i-lucide-euro"
				/>
			</UFormField>
			<p
				v-if="state.category === 'onigiri'"
				class="text-sm text-muted sm:self-center"
			>
				{{
					sharedOnigiriPriceAvailable
						? 'Uses shared Onigiri prices.'
						: 'Initializes shared Onigiri prices.'
				}}
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	productCategories,
	type ProductCreationFormState,
	type ProductSchema,
} from './types';

const props = withDefaults(
	defineProps<{
		onigiriPricing?: { price: number; helperPrice?: number };
		compact?: boolean;
		formValidation?: boolean;
		showSupplyCost?: boolean;
	}>(),
	{
		onigiriPricing: undefined,
		compact: false,
		formValidation: false,
		showSupplyCost: false,
	},
);

const state = defineModel<ProductCreationFormState>('state', {
	required: true,
});

const supplierOptions: {
	label: ProductSchema['supplier'];
	value: ProductSchema['supplier'];
}[] = [
	{ label: 'HDJ', value: 'HDJ' },
	{ label: 'Otaku', value: 'Otaku' },
];

const sharedOnigiriPriceAvailable = computed(
	() => state.value.category === 'onigiri' && !!props.onigiriPricing,
);

watch(
	() =>
		[
			state.value.category,
			props.onigiriPricing?.price,
			props.onigiriPricing?.helperPrice,
		] as const,
	([category, sharedPrice, sharedHelperPrice]) => {
		if (category !== 'onigiri' || sharedPrice === undefined) return;
		state.value.price = sharedPrice.toFixed(2);
		state.value.helperPrice =
			sharedHelperPrice === undefined ? '' : String(sharedHelperPrice);
	},
);
</script>
