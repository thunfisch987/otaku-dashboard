<template>
	<dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
		<div
			v-for="field in fields"
			:key="field.label"
		>
			<dt class="text-muted">{{ field.label }}</dt>
			<dd class="mt-0.5 tabular-nums">{{ field.value }}</dd>
		</div>
	</dl>
</template>

<script setup lang="ts">
import type { ProductSchema } from './types';
import { productCategoryLabel } from './format';
import { formatOptionalCurrency } from '~/utils/currency';

export type MobileDetailLabel =
	'Category' | 'Supplier' | 'Helper price' | 'Supply cost';

const props = defineProps<{
	product: ProductSchema;
	/** Fields already shown on the collapsed card, so they are not repeated. */
	exclude?: MobileDetailLabel[];
}>();

const fields = computed(() => {
	const all: { label: MobileDetailLabel; value: string }[] = [
		{
			label: 'Category',
			value: productCategoryLabel(props.product.category),
		},
		{ label: 'Supplier', value: props.product.supplier },
		{
			label: 'Helper price',
			value: formatOptionalCurrency(props.product.helperPrice),
		},
		{
			label: 'Supply cost',
			value: formatOptionalCurrency(props.product.supplyCost),
		},
	];
	return all.filter((field) => !props.exclude?.includes(field.label));
});
</script>
