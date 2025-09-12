import * as z from 'zod';

export const googleUserSchema = z.object({
	sub: z.string().min(1),
	name: z.string().min(1),
	given_name: z.string().min(1),
	family_name: z.string().min(1),
	picture: z.url().min(1),
	email: z.email().min(1),
	email_verified: z.boolean(),
});

export const googleTokensSchema = z.object({
	access_token: z.string(),
	expires_in: z.number(),
	scope: z.string(),
	token_type: z.string(),
	id_token: z.string(),
});
