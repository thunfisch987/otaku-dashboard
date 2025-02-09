import { drizzle } from 'drizzle-orm/d1';
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from 'drizzle-zod';
import type { z } from 'zod';
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
export type UpdateProduct = typeof schema.products.$inferInsert;

export type SelectPasskey = typeof schema.passkeys.$inferSelect;
export type InsertPasskey = typeof schema.passkeys.$inferInsert;

export const passkeySelectSchema = createSelectSchema(tables.passkeys);
export const passkeyInsertSchema = createInsertSchema(tables.passkeys);
export const passkeyUpdateSchema = createUpdateSchema(tables.passkeys);

export const productSelectSchema = createSelectSchema(tables.products);
export const productInsertSchema = createInsertSchema(tables.products);
export const productUpdateSchema = createUpdateSchema(tables.products);

type _ProductSelectSchema = z.infer<typeof productSelectSchema>;
type _ProductInsertSchema = z.infer<typeof productInsertSchema>;
type _ProductUpdateSchema = z.infer<typeof productUpdateSchema>;
