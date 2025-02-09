import * as z from 'zod';
import type { H3Error, H3Event } from 'h3';
import type { InsertPasskey } from '../../utils/drizzle';
import { eq, passkeyInsertSchema } from '../../utils/drizzle';
import type { User, UserSession } from '#auth-utils';

export default defineWebAuthnRegisterEventHandler({
	// async validateUser(userBody: unknown, event: H3Event) {
	// 	const session = await getUserSession(event);
	// 	const parsedBody = z
	// 		.object({
	// 			userName: z.string().email(),
	// 		})
	// 		.parse(userBody);
	// 	if (session.user?.email && session.user.email !== parsedBody.userName) {
	// 		throw createError({
	// 			statusCode: 400,
	// 			message: 'Email not matching current session',
	// 		});
	// 	}
	// 	return parsedBody;
	// },
	async onSuccess(
		event: H3Event,
		{
			credential,
			user,
		}: { credential: Omit<InsertPasskey, 'userId'>; user: User },
	) {
		try {
			const dbUser = await useDrizzle()
				.select()
				.from(tables.users)
				.where(eq(tables.users.email, user.email))
				.get();

			await useDrizzle()
				.insert(tables.passkeys)
				.values({
					userId: dbUser.id,
					id: credential.id,
					publicKey: credential.publicKey,
					counter: credential.counter,
					backedUp: credential.backedUp ? 1 : 0,
					transports: JSON.stringify(credential.transports ?? []),
				});
			await setUserSession(event, {
				user: {
					webAuthn: dbUser?.email,
				},
				login_at: Date.now(),
				// stopping it from complaining about the types :
			} as unknown as UserSession);
		} catch (err) {
			try {
				const error = z.object({ message: z.string() }).parse(err);
				throw createError({
					statusCode: 500,
					message: error.message.includes('UNIQUE constraint failed')
						? 'User already registered'
						: 'Failed to store credential',
				});
			} catch (e) {
				// @ts-expect-error ffs ffs ffs
				console.error(Error(e));
			}
		}
	},
});
