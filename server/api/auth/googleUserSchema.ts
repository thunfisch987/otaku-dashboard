import * as z from 'zod';

export const googleUserSchema = z.object({
	name: z.string().min(1),
	given_name: z.string().min(1),
	family_name: z.string().min(1),
	picture: z.string().url().min(1),
	email: z.string().email().min(1),
	sub: z.string(),
});
