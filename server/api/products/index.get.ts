export default defineEventHandler(async (event) => {
	await requireUserSession(event);
	const todos = await useDrizzle().select().from(tables.products).all();
	return todos;
});
