import { convexClient } from '@convex-dev/better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';
import { defineClientAuth } from '@nuxtjs/better-auth/config';

export default defineClientAuth(({ siteUrl }) => ({
	baseURL: new URL(
		'/api/auth',
		import.meta.client ? window.location.origin : siteUrl,
	).toString(),
	// No crossDomainClient: the auth server is reached through the
	// same-origin /api/auth proxy, so the session cookie is first-party and
	// nuxt-convex's client token plugin and SSR cookie→JWT exchange are both
	// cookie-based. crossDomainClient would move the session into
	// localStorage (credentials: 'omit') and break both.
	plugins: [convexClient(), passkeyClient()],
}));
