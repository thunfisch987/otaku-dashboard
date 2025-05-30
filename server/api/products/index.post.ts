import type { InsertProduct } from '~~/server/utils/drizzle';
import { updateLatestBackendData } from './stream';

export default defineEventHandler<{ body: InsertProduct }>(async (event) => {
	await requireUserSession(event);
	const { productname, price, supplier, picture, amount } =
		await readBody(event);
	console.log();
	const product = await useDrizzle()
		.insert(tables.products)
		.values({
			productname: productname,
			price: price,
			supplier: supplier,
			picture: picture,
			updatedAt: new Date(),
			createdAt: new Date(),
			amount: amount,
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
	updateLatestBackendData();
	return product;
});
