import type { Row } from '@tanstack/vue-table';
import type { ProductSchema } from '~/components/Inventory/types';
import { api } from '#convex/api';
import type { Id } from '~~/convex/_generated/dataModel';

export const deleteProduct = async (row: Row<ProductSchema>) => {
	const nuxtApp = useNuxtApp();
	await nuxtApp.runWithContext(() => {
		const { mutate } = useConvexMutation(api.products.remove);
		mutate({ id: row.original._id as Id<'products'> });
	});
};
