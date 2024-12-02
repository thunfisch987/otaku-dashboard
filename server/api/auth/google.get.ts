export default defineOAuthGoogleEventHandler({
	config: {
		scope: ['email', 'profile'],
	},
	async onSuccess(event, { user, tokens }) {
		await setUserSession(event, {
			user: {
				googleId: user.id,
			},
		});
		return sendRedirect(event, '/dashboard');
	},
});
