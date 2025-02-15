import type { InsertProduct } from '~~/server/utils/drizzle';

export default defineEventHandler<{ body: InsertProduct }>(async (event) => {
	await requireUserSession(event);
	const { productname, price, supplier, picture } = await readBody(event);
	const product = await useDrizzle()
		.insert(tables.products)
		.values({
			productname: productname,
			price: price,
			supplier: supplier,
			picture: picture,
			updatedAt: new Date(),
			createdAt: new Date(),
		})
		.onConflictDoNothing()
		.returning()
		.get();
	if (!product) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Conflict',
			message: 'Product already exists',
			data: { productname, price, supplier, picture },
		});
	}
	return product;
});
