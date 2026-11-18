import type { PatchProductSchema, ProductSchema } from './types';
import type { Row } from '@tanstack/vue-table';
import { formatMoneyInput } from '~/utils/currency';

export function prepareEditForm(row: Row<ProductSchema>) {
	const editProductState = useState<PatchProductSchema>('editProductState');
	const editProductOpen = useState<boolean>('editProductOpen');

	editProductOpen.value = true;
	editProductState.value.amount = row.original.amount;
	editProductState.value.picture = row.original.picture;
	editProductState.value.helperPrice =
		row.original.helperPrice === undefined
			? ''
			: formatMoneyInput(row.original.helperPrice);
	editProductState.value.supplyCost =
		row.original.supplyCost === undefined
			? ''
			: formatMoneyInput(row.original.supplyCost);
	editProductState.value.price = formatMoneyInput(row.original.price);
	editProductState.value.productname = row.original.productname;
	editProductState.value.category = row.original.category;
	editProductState.value.supplier = row.original.supplier;
	editProductState.value._id = String(row.original._id);
}

export function resetFormState() {
	const editProductState = useState<PatchProductSchema>('editProductState');
	editProductState.value.productname = '';
	editProductState.value.price = '';
	editProductState.value.category = 'other';
	editProductState.value.supplier = 'Otaku';
	editProductState.value.amount = 0;
	editProductState.value.picture = '';
	editProductState.value.helperPrice = '';
	editProductState.value.supplyCost = '';
	editProductState.value._id = '';
}
