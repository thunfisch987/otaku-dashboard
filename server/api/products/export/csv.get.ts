import type { H3Event } from 'h3';
import { json2csv } from 'json-2-csv';

export default defineEventHandler(async (event: H3Event) => {
	await requireUserSession(event);
	const allProducts = await useDrizzle().select().from(tables.products).all();
	const csvProducts = json2csv(allProducts);
	event.node.res.setHeader('Content-Type', 'text/csv; charset=utf-8');
	return csvProducts;
});
