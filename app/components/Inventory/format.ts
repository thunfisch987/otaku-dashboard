import type { ProductSchema } from './types';

export function productCategoryLabel(category: ProductSchema['category']) {
	const labels: Record<
		Exclude<ProductSchema['category'], undefined>,
		string
	> = {
		onigiri: 'Onigiri',
		food: 'Food',
		snacks: 'Snacks',
		other: 'Other',
	};
	return (category && labels[category]) ?? '—';
}

/**
 * Stock is the one value operators must never misread, so every inventory
 * layout (table and mobile) shares the same label and colour.
 */
export function stockSummary(amount: number): {
	label: string;
	color: 'error' | 'success';
} {
	return amount === 0
		? { label: 'Out of stock', color: 'error' }
		: { label: `${amount} in stock`, color: 'success' };
}
