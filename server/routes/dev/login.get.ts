/**
 * Dev-only convenience login for automated browser checks.
 *
 * Only exists while running `nuxt dev` and only when ENABLE_DEV_TOOLS is set
 * for a non-production site URL. It signs in as the seeded operator account
 * through the normal same-origin /api/auth proxy, so the session cookie stays
 * first-party and nuxt-convex's cookie→JWT exchange keeps working exactly like
 * a human login.
 *
 * Helpers come from `nuxt/server` (Nitro v3 / h3 v2) rather than `h3`: the
 * upstream `Set-Cookie` headers are forwarded by returning a `Response`, which
 * keeps the Better Auth cookie attributes exactly as the proxy emitted them.
 *
 * Usage: http://localhost:3001/dev/login?next=/dash/dashboard
 */
import {
	createError,
	defineHandler,
	getQuery,
	getRequestURL,
} from 'nuxt/server';

const DEFAULT_NEXT = '/dash/dashboard';
const PRODUCTION_HOST_SUFFIX = 'lilbitgay.de';

function safeNextPath(value: unknown): string {
	const raw = Array.isArray(value) ? value[0] : value;
	if (typeof raw !== 'string') return DEFAULT_NEXT;
	// Only same-origin paths. Reject absolute/protocol-relative URLs and
	// backslashes, which browsers normalize to "/" in a Location header.
	// Control characters such as tabs are stripped while browsers parse a
	// URL, so "/<TAB>/host" would resolve to the external "//host".
	if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) {
		return DEFAULT_NEXT;
	}
	if ([...raw].some((char) => isControlCharacter(char))) {
		return DEFAULT_NEXT;
	}
	if (raw.split('?')[0] === '/dev/login') return DEFAULT_NEXT;
	return raw;
}

function isControlCharacter(char: string): boolean {
	const code = char.charCodeAt(0);
	return code <= 0x1f || code === 0x7f;
}

function isProductionSite(siteUrl: string | undefined): boolean {
	if (!siteUrl) return false;
	try {
		const host = new URL(siteUrl).hostname.toLowerCase();
		return (
			host === PRODUCTION_HOST_SUFFIX ||
			host.endsWith(`.${PRODUCTION_HOST_SUFFIX}`)
		);
	} catch {
		return false;
	}
}

export default defineHandler(async (event) => {
	const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
	if (
		!import.meta.dev ||
		process.env.ENABLE_DEV_TOOLS !== 'true' ||
		isProductionSite(siteUrl)
	) {
		throw createError({ status: 404, statusText: 'Not Found' });
	}

	const email = process.env.DEV_AUTH_EMAIL?.trim();
	const password = process.env.DEV_AUTH_PASSWORD;
	if (!email || !password) {
		throw createError({
			status: 500,
			statusText: 'Dev login is not configured',
			message:
				'Set DEV_AUTH_EMAIL and DEV_AUTH_PASSWORD in .env.local, then ' +
				'restart Nuxt. See AGENTS.md, "Verifying signed-in surfaces".',
		});
	}

	const next = safeNextPath(getQuery(event).next);
	// h3 v1 read `x-forwarded-proto` unconditionally; h3 v2 needs the opt-in.
	// `bun run dev:tail` forwards HTTPS from Tailscale to the plaintext dev
	// server, so without this the origin would claim `http://…:8443` and the
	// sign-in fetch below would fail.
	const origin = getRequestURL(event, { xForwardedProto: true }).origin;

	const response = await fetch(`${origin}/api/auth/sign-in/email`, {
		method: 'POST',
		headers: { 'content-type': 'application/json', origin },
		body: JSON.stringify({ email, password }),
	});

	if (!response.ok) {
		const data = (await response.json().catch(() => null)) as {
			message?: string;
		} | null;
		throw createError({
			status: 401,
			statusText: 'Dev login failed',
			message:
				data?.message ??
				'Check that the dev operator exists (bun run seed:dev) and that ' +
					'the password matches DEV_AUTH_PASSWORD.',
		});
	}

	const headers = new Headers({ location: next });
	for (const cookie of response.headers.getSetCookie()) {
		headers.append('set-cookie', cookie);
	}

	return new Response(null, { status: 302, headers });
});
