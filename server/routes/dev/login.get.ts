/**
 * Dev-only convenience login for automated browser checks.
 *
 * Only exists while running `nuxt dev` and only when ENABLE_DEV_TOOLS is set
 * for a non-production site URL. It signs in as the seeded operator account
 * through the normal same-origin /api/auth proxy, so the session cookie stays
 * first-party and nuxt-convex's cookie→JWT exchange keeps working exactly like
 * a human login.
 *
 * Usage: http://localhost:3001/dev/login?next=/dash/dashboard
 */
import {
	createError,
	defineEventHandler,
	getQuery,
	getRequestURL,
	sendRedirect,
	setResponseHeader,
} from 'h3';

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

export default defineEventHandler(async (event) => {
	const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
	if (
		!import.meta.dev ||
		process.env.ENABLE_DEV_TOOLS !== 'true' ||
		isProductionSite(siteUrl)
	) {
		throw createError({ statusCode: 404, statusMessage: 'Not Found' });
	}

	const email = process.env.DEV_AUTH_EMAIL?.trim();
	const password = process.env.DEV_AUTH_PASSWORD;
	if (!email || !password) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Dev login is not configured',
			message:
				'Set DEV_AUTH_EMAIL and DEV_AUTH_PASSWORD in .env.local, then ' +
				'restart Nuxt. See AGENTS.md, "Verifying signed-in surfaces".',
		});
	}

	const next = safeNextPath(getQuery(event).next);
	const origin = getRequestURL(event).origin;

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
			statusCode: 401,
			statusMessage: 'Dev login failed',
			message:
				data?.message ??
				'Check that the dev operator exists (bun run seed:dev) and that ' +
					'the password matches DEV_AUTH_PASSWORD.',
		});
	}

	const cookies = response.headers.getSetCookie();
	if (cookies.length > 0) {
		setResponseHeader(event, 'set-cookie', cookies);
	}

	return sendRedirect(event, next, 302);
});
