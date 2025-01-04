import { drizzle } from 'drizzle-orm/d1';

import * as schema from '../database/schema';

export { sql, eq, and, or } from 'drizzle-orm';

export const tables = schema;

export function useDrizzle() {
	return drizzle(hubDatabase(), { schema });
}

export type SelectUser = typeof schema.users.$inferSelect;
export type InsertUser = typeof schema.users.$inferInsert;

export type SelectProduct = typeof schema.products.$inferSelect;
export type InsertProduct = typeof schema.products.$inferInsert;
