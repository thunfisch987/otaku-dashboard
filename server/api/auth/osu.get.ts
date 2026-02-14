import { SecureSessionData } from '#auth-utils';

export default defineOAuthOsuEventHandler({
	config: {
		scope: ['identify'],
	},
	async onSuccess(event, { user, tokens }) {
		await setUserSession(event, {
			user: {
				avatar: user.avatar_url,
				email: '',
				sub: user.id,
				name: user.username,
				given_name: user.username,
				family_name: user.username,
				email_verified: user.email_verified,
				tokens: {
					expires_in: tokens.expires_in,
					expires_at: tokens.expires_in * 1000 + Date.now(),
					id_token: '',
					scope: '',
					token_type: tokens.token_type,
				},
				login_methods: {
					osu: true,
				},
			},
			secure: {
				access_token: tokens.access_token,
				refresh_token: tokens.refresh_token,
			},
			login_at: new Date(),
		});
		return sendRedirect(event, '/dash/dashboard');
	},
	onError(event, error) {
		console.error('Osu OAuth error:', error);
		// You can choose to send an error response instead of redirecting
		// return sendRedirect(event, '/');
	},
});
