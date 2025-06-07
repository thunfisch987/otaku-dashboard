import type { ProductSchema } from '../types';
import type { Row } from '@tanstack/vue-table';
import { FetchError } from 'ofetch';

const toast = useToast();

export async function deleteProductFetch(rows: Row<ProductSchema>[]) {
	try {
		for (const row of rows) {
			const data = await useRequestFetch()(
				`/api/products/${row.original.id}`,
				{
					method: 'delete',
				},
			);
			toast.add({
				title: `Produkt namens ${data.productname} gelöscht!`,
				description: 'GELÖSCHT.',
				color: 'error',
				close: { color: 'success' },
			});
		}
		return 200;
	} catch (error) {
		if (error instanceof FetchError) {
			if (
				error.data.statusCode === 404 &&
				error.data.statusMessage === 'Not Found' &&
				error.data.message === 'Product not found'
			) {
				toast.add({
					title: 'Löschen nicht möglich!',
					description: `Ein Produkt mit der ID "${error.data.data.productId}" existiert nicht!`,
					color: 'error',
					duration: 0,
					close: { color: 'error', variant: 'outline' },
				});
				return 409;
			}
			return 500;
		} else {
			console.error(error);
		}
	}
}
