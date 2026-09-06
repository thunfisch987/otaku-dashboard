/* eslint-disable node/prefer-global/process */
// Convex-runtime compatible env helpers (no node:process import)
const DEFAULT_DEV_SITE_URL = 'http://localhost:3000';
const DEFAULT_SITE_URL = 'https://demo-nuxt-convex.onmax.me';
const DISABLED_VALUES = new Set(['0', 'false', 'no', 'off']);

export function getPlaygroundSiteUrl(): string {
	return (
		process.env.NUXT_PUBLIC_SITE_URL ||
		process.env.SITE_URL ||
		(process.env.NODE_ENV === 'production'
			? DEFAULT_SITE_URL
			: DEFAULT_DEV_SITE_URL)
	);
}

export function isGoogleAuthEnabled(): boolean {
	const explicit = process.env.ENABLE_GOOGLE_AUTH;
	if (explicit != null && explicit !== '') {
		return !DISABLED_VALUES.has(explicit.toLowerCase());
	}

	return Boolean(
		process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
	);
}
