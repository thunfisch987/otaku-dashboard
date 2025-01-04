export default defineOAuthGoogleEventHandler({
	config: {
		scope: ['email', 'profile'],
	},
	// @ts-expect-error these are always any
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
		return sendRedirect(event, '/dashboard');
	},
});
