import type { Row } from '@tanstack/vue-table';
import type { ProductSchema } from '~/components/DataTable/types';
import { api } from '~~/convex/_generated/api';
import type { Id } from '~~/convex/_generated/dataModel';

export const deleteProduct = (row: Row<ProductSchema>) => {
	const nuxtApp = useNuxtApp();
	nuxtApp.runWithContext(() => {
		const { mutate } = useConvexMutation(api.products.remove);
		mutate({ id: row.original._id as Id<'products'> });
	});
};
