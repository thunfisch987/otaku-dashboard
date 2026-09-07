import {
	convexClient,
	crossDomainClient,
} from '@convex-dev/better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';
import { defineClientAuth } from '@onmax/nuxt-better-auth/config';

export default defineClientAuth(({ siteUrl }) => ({
	baseURL: new URL(
		'/api/auth',
		import.meta.client ? window.location.origin : siteUrl,
	).toString(),
	plugins: [convexClient(), crossDomainClient(), passkeyClient()],
}));
