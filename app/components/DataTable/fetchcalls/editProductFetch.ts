import type { FormSubmitEvent } from '@nuxt/ui';
import type { PatchProductSchema } from '../types';
import { FetchError } from 'ofetch';

const toast = useToast();

export async function editProductFetch(
	formSubmitEvent: FormSubmitEvent<PatchProductSchema>,
	unmaskedValue: string,
) {
	try {
		const data = await useRequestFetch()(
			`/api/products/${formSubmitEvent.data.id}`,
			{
				method: 'patch',
				body: {
					productname: formSubmitEvent.data.productname,
					supplier: formSubmitEvent.data.supplier,
					price: Number.parseFloat(unmaskedValue),
					amount: formSubmitEvent.data.amount,
					picture: formSubmitEvent.data.picture,
					id: Number(formSubmitEvent.data.id),
				},
			},
		);

		toast.add({
			title: 'Bearbeiten erfolgreich',
			description: `Produkt namens ${data.productname} erfolgreich bearbeitet!`,
			color: 'success',
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
					ui: {
						root: 'ring-(--ui-error)',
					},
				});
				return 409;
			}
			return 500;
		} else {
			console.error(error);
		}
	}
}
