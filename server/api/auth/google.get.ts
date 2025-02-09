import type { H3Event, H3Error } from 'h3';
import { type InsertUser, tables, useDrizzle } from '../../utils/drizzle';
import { googleUserSchema } from './googleUserSchema';

export default defineOAuthGoogleEventHandler({
	config: {
		scope: ['email', 'profile'],
	},
	async onSuccess(event: H3Event, { user }: { user: unknown }) {
		const parsedUser = googleUserSchema.parse(user);
		await setUserSession(event, {
			user: {
				name: parsedUser.name,
				given_name: parsedUser.given_name,
				family_name: parsedUser.family_name,
				avatar: parsedUser.picture,
				email: parsedUser.email,
				id: parsedUser.sub,
			},
			login_at: new Date(),
		});
		const dbUser: InsertUser = {
			id: parsedUser.sub,
			name: parsedUser.name,
			givenName: parsedUser.given_name,
			familyName: parsedUser.family_name,
			email: parsedUser.email,
			avatar: parsedUser.picture,
			lastLogin: new Date(),
			createdAt: new Date(),
		};
		await useDrizzle()
			.insert(tables.users)
			.values(dbUser)
			.onConflictDoUpdate({
				target: tables.users.id,
				set: { lastLogin: dbUser.lastLogin },
			});
		return sendRedirect(event, '/dash/dashboard');
	},
	onError(event: H3Event, error: H3Error) {
		console.error('Google OAuth error:', error);
		// You can choose to send an error response instead of redirecting
		return sendRedirect(event, '/');
	},
});
