export default defineEventHandler(async (event) => {
	await requireUserSession(event);
	const products = await useDrizzle().select().from(tables.products).all();
	return products;
});
