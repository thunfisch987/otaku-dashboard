import type { PatchProductSchema, ProductSchema } from './types';
import type { Row } from '@tanstack/vue-table';

export function prepareEditForm(row: Row<ProductSchema>) {
	const editProductState = useState<PatchProductSchema>('editProductState');
	const editProductOpen = useState<boolean>('editProductOpen');
	const unmaskedProductEditValue = useState<string>(
		'unmaskedProductEditValue',
	);

	editProductOpen.value = true;
	editProductState.value.amount = row.original.amount;
	editProductState.value.picture = row.original.picture;
	editProductState.value.price = Intl.NumberFormat('de-DE').format(
		row.original.price,
	);
	editProductState.value.productname = row.original.productname;
	editProductState.value.supplier = row.original.supplier;
	editProductState.value._id = String(row.original._id);
	unmaskedProductEditValue.value = String(row.original.price);
}

export function resetFormState() {
	const editProductState = useState<PatchProductSchema>('editProductState');
	const unmaskedProductEditValue = useState<string>(
		'unmaskedProductEditValue',
	);
	editProductState.value.productname = '';
	editProductState.value.price = '';
	editProductState.value.supplier = 'Otaku';
	editProductState.value.amount = 0;
	editProductState.value.picture = '';
	editProductState.value._id = '';
	unmaskedProductEditValue.value = '';
}
