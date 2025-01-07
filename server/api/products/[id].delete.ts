export default defineEventHandler(async (event) => {
	await requireUserSession(event);
	const { id } = getRouterParams(event);

	const deletedProduct = await useDrizzle().delete(tables.products).where(and(
		eq(tables.products.id, Number(id)),
	)).returning().get();

	if (!deletedProduct) {
		throw createError({
			statusCode: 404,
			message: 'Product not found',
		});
	}

	return deletedProduct;
});