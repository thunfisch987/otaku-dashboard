import { productInsertSchema } from '~/server/utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireUserSession(event);
	const { id } = getRouterParams(event);
	const result = await readValidatedBody(event, (body) => productInsertSchema.safeParse(body));
	if (!result.success) {
		throw result.error.issues;
	}
	const { name, price, supplier, picture } = result.data;
	const updatedAt = new Date();

	const products = await useDrizzle().update(tables.products).set({
		name,
		price,
		supplier,
		picture,
		updatedAt,
	}).where(eq(tables.products.id, Number(id))).returning().get();

	return products;
});
