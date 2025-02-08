// import { productUpdateSchema } from '../../utils/drizzle';

import type { UpdateProduct } from '~~/server/utils/drizzle';

export default defineEventHandler<{ body: UpdateProduct }>(async (event) => {
	await requireUserSession(event);
	const { id } = getRouterParams(event);
	// const result = await readValidatedBody(event, (body) =>
	// 	productIUpdateSchema.safeParse(body),
	// );
	const { productname, price, supplier, picture } = await readBody(event);
	// console.log(result);
	// if (!result.success) {
	// 	throw result.error.issues;
	// }
	// const { productname, price, supplier, picture } = result.data;
	// const updatedAt = new Date();
	try {
		const product = await useDrizzle()
			.update(tables.products)
			.set({
				productname: productname,
				price: price,
				supplier: supplier,
				picture: picture,
				updatedAt: new Date(),
				createdAt: new Date(),
			})
			.where(eq(tables.products.id, Number(id)))
			.returning()
			.get();
		return product;
	} catch (dbError) {
		if (dbError instanceof Error) {
			if (dbError.message) {
				if (dbError.message.includes('D1_ERROR: UNIQUE')) {
					throw createError({
						statusCode: 409,
						statusMessage: 'Conflict',
						message: 'Product already exists',
						data: { productname, price, supplier, picture },
					});
				}
			}
		} else {
			throw createError({
				statusCode: 500,
				statusMessage: 'Internal Server Error',
				message: String(dbError),
			});
		}
	}
});
