import type { SecureSessionData, User } from '#auth-utils';
import { googleTokensSchema, googleUserSchema } from './googleUserSchema';

export default defineOAuthGoogleEventHandler({
	config: {
		scope: ['email', 'profile', 'openid'],
		authorizationParams: { access_type: 'offline' },
	},
	async onSuccess(
		event,
		{ user, tokens }: { user: unknown; tokens: unknown },
	) {
		const parsedUser = googleUserSchema.parse(user);
		const parsedTokens = googleTokensSchema.parse(tokens);
		await setUserSession(event, {
			user: {
				sub: parsedUser.sub,
				name: parsedUser.name,
				given_name: parsedUser.given_name,
				family_name: parsedUser.family_name,
				avatar: parsedUser.picture,
				email: parsedUser.email,
				email_verified: parsedUser.email_verified,
				tokens: {
					expires_in: parsedTokens.expires_in,
					scope: parsedTokens.scope,
					token_type: parsedTokens.token_type,
					id_token: parsedTokens.id_token,
					expires_at: parsedTokens.expires_in * 1000 + Date.now(),
				},
			} satisfies User,
			secure: {
				access_token: parsedTokens.access_token,
			} satisfies SecureSessionData,
			login_at: new Date(),
		});
		// const dbUser: InsertUser = {
		// 	id: parsedUser.sub,
		// 	name: parsedUser.name,
		// 	givenName: parsedUser.given_name,
		// 	familyName: parsedUser.family_name,
		// 	email: parsedUser.email,
		// 	avatar: parsedUser.picture,
		// 	lastLogin: new Date(),
		// 	createdAt: new Date(),
		// };
		// await useDrizzle()
		// 	.insert(tables.users)
		// 	.values(dbUser)
		// 	.onConflictDoUpdate({
		// 		target: tables.users.id,
		// 		set: { lastLogin: dbUser.lastLogin },
		// 	});
		return sendRedirect(event, '/dash/dashboard');
	},
	onError(event, error) {
		console.error('Google OAuth error:', error);
		// You can choose to send an error response instead of redirecting
		// return sendRedirect(event, '/');
	},
});
