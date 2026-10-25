/* eslint-disable node/prefer-global/process */
// Convex-runtime compatible env helpers (no node:process import)
const DEFAULT_DEV_SITE_URL = 'http://localhost:3001';
const DEFAULT_SITE_URL = 'https://www.lilbitgay.de';
const DISABLED_VALUES = new Set(['0', 'false', 'no', 'off']);
const LOCAL_AUTH_HOSTS = [
	'localhost:3000',
	'localhost:3001',
	'127.0.0.1:3000',
	'127.0.0.1:3001',
];

export function getPlaygroundSiteUrl(): string {
	return (
		process.env.NUXT_PUBLIC_SITE_URL ||
		process.env.SITE_URL ||
		(process.env.NODE_ENV === 'production'
			? DEFAULT_SITE_URL
			: DEFAULT_DEV_SITE_URL)
	);
}

export function getAuthAllowedHosts(): string[] {
	const siteHost = new URL(getPlaygroundSiteUrl()).host;
	if (process.env.ENABLE_DEV_AUTH_ORIGINS !== 'true') {
		return [siteHost];
	}

	const extraHosts = (process.env.AUTH_ALLOWED_HOSTS ?? '')
		.split(',')
		.map((host) => host.trim())
		.filter(Boolean);

	return [...new Set([siteHost, ...LOCAL_AUTH_HOSTS, ...extraHosts])];
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
