export default defineEventHandler(async (event) => {
	await requireUserSession(event);
	const { name, price, supplier, picture } = await readBody(event);
	const product = await useDrizzle().insert(tables.products).values({
		name: name,
		price: price,
		supplier: supplier,
		picture: picture,
		updatedAt: new Date(),
		createdAt: new Date(),
	}).returning().get();

	return product;
});
