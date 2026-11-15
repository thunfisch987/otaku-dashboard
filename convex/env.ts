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
	const convexSiteHost = process.env.CONVEX_SITE_URL
		? new URL(process.env.CONVEX_SITE_URL).host
		: undefined;
	const deploymentHosts = convexSiteHost ? [convexSiteHost] : [];
	const appHosts = [siteHost, ...deploymentHosts];

	if (process.env.ENABLE_DEV_AUTH_ORIGINS !== 'true') {
		return [...new Set(appHosts)];
	}

	const extraHosts = (process.env.AUTH_ALLOWED_HOSTS ?? '')
		.split(',')
		.map((host) => host.trim())
		.filter(Boolean);

	return [...new Set([...appHosts, ...LOCAL_AUTH_HOSTS, ...extraHosts])];
}

/**
 * True when the configured site URL points at the production domain. Dev-only
 * features check this so a stray env var on a production deployment cannot
 * open them up.
 */
export function isProductionSiteUrl(): boolean {
	return (
		new URL(getPlaygroundSiteUrl()).host === new URL(DEFAULT_SITE_URL).host
	);
}

/**
 * Dev-only tooling (email/password login for a seeded operator, demo seed
 * commands). Requires an explicit opt-in and a non-production site URL.
 */
export function isDevToolsEnabled(): boolean {
	return process.env.ENABLE_DEV_TOOLS === 'true' && !isProductionSiteUrl();
}

export function getDevAuthEmail(): string {
	const email = getDevAuthEmailOrNull();
	if (!email) {
		throw new Error(
			'DEV_AUTH_EMAIL is not set on this deployment. Add it to .env.local ' +
				'and restart `convex dev` (see AGENTS.md, "Verifying signed-in surfaces").',
		);
	}
	return email;
}

/** Non-throwing variant for config hooks that must not fail module load. */
export function getDevAuthEmailOrNull(): string | null {
	const email = process.env.DEV_AUTH_EMAIL?.trim().toLowerCase();
	return email || null;
}

export function getDevAuthPassword(): string {
	const password = process.env.DEV_AUTH_PASSWORD;
	if (!password || password.length < 12) {
		throw new Error(
			'DEV_AUTH_PASSWORD must be set to at least 12 characters on this ' +
				'deployment. Add it to .env.local and restart `convex dev` ' +
				'(see AGENTS.md, "Verifying signed-in surfaces").',
		);
	}
	return password;
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
