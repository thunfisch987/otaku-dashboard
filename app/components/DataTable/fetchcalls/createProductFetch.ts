import type { FormSubmitEvent } from '@nuxt/ui';
import type { InsertProductSchema } from '../types';
import { FetchError } from 'ofetch';

const toast = useToast();

export async function createProductFetch(
	formSubmitEvent: FormSubmitEvent<InsertProductSchema>,
	unmaskedValue: string,
) {
	try {
		const data = await useRequestFetch()('/api/products', {
			method: 'post',
			body: {
				productname: formSubmitEvent.data.productname,
				price: Number.parseFloat(unmaskedValue),
				supplier: formSubmitEvent.data.supplier,
				amount: formSubmitEvent.data.amount,
				picture: formSubmitEvent.data.picture,
			},
		});

		toast.add({
			title: `Produkt namens ${data.productname} erstellt!`,
			color: 'success',
			id: 'modal-success',
		});
		return 200;
	} catch (error) {
		if (error instanceof FetchError) {
			if (
				error.data.statusCode === 409 &&
				error.data.statusMessage === 'Conflict' &&
				error.data.message === 'Product already exists'
			) {
				toast.add({
					title: `Ein Produkt mit dem Namen "${error.data.data.productname}" existiert bereits!`,
					description: 'Bitte wähle einen anderen Namen.',
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
		return 500;
	}
}
