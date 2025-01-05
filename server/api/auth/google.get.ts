import { type InsertUser, tables, useDrizzle } from '~/server/utils/drizzle';

export default defineOAuthGoogleEventHandler({
	config: {
		scope: ['email', 'profile'],
	},
	async onSuccess(event, { user }) {
		await setUserSession(event, {
			user: {
				name: user.name,
				given_name: user.given_name,
				family_name: user.family_name,
				avatar: user.picture,
				email: user.email,
				id: user.sub,
			},
			login_at: new Date(),
		});
		const dbUser: InsertUser = {
			id: user.sub,
			name: user.name,
			givenName: user.given_name,
			familyName: user.family_name,
			email: user.email,
			avatar: user.picture,
			lastLogin: new Date(),
			createdAt: new Date(),
		};
		await useDrizzle().insert(tables.users).values(dbUser).onConflictDoUpdate({
			target: tables.users.id,
			set: { lastLogin: dbUser.lastLogin },
		});
		return sendRedirect(event, '/dashboard');
	},
});
