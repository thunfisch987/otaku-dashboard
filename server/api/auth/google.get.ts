import type { InsertUser } from '~/server/utils/drizzle';

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
			},
		});
		const dbUser: InsertUser = {
			id: Number(user.sub),
			name: String(user.name),
			givenName: String(user.given_name),
			familyName: String(user.family_name),
			email: String(user.email),
			avatar: String(user.picture),
			lastLogin: new Date(),
			createdAt: new Date(),
		};
		await useDrizzle().insert(tables.users).values(dbUser);
		return sendRedirect(event, '/dashboard');
	},
});
