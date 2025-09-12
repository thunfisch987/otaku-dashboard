export default {
	providers: [
		{
			domain: 'https://accounts.google.com',
			applicationID: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
		},
	],
};
