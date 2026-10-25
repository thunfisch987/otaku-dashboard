import {
	createError,
	defineEventHandler,
	getRequestHeaders,
	setResponseStatus,
	useRuntimeConfig,
} from 'nuxt/server';

function toConvexSiteUrl(convexUrl: string): string {
	const url = new URL(convexUrl);
	url.hostname = url.hostname.replace('.convex.cloud', '.convex.site');
	return url.toString();
}

export default defineEventHandler(async (event) => {
	const requestUrl = event.url;
	const convexUrl = (useRuntimeConfig().public.convex as { url?: string })
		?.url;

	if (!convexUrl) {
		throw createError({
			status: 500,
			statusText: 'Missing public Convex URL',
		});
	}

	const targetUrl = new URL(
		`${requestUrl.pathname}${requestUrl.search}`,
		toConvexSiteUrl(convexUrl),
	);
	const target = targetUrl.toString();
	const headers = new Headers();
	for (const [key, value] of Object.entries(getRequestHeaders(event))) {
		if (value !== undefined) headers.set(key, value);
	}

	headers.delete('content-length');
	headers.delete('host');
	headers.set('x-forwarded-host', requestUrl.host);
	headers.set('x-forwarded-proto', requestUrl.protocol.replace(/:$/, ''));
	headers.set('x-better-auth-forwarded-host', requestUrl.host);
	headers.set(
		'x-better-auth-forwarded-proto',
		requestUrl.protocol.replace(/:$/, ''),
	);

	const body = ['PATCH', 'POST', 'PUT', 'DELETE'].includes(event.req.method)
		? await event.req.arrayBuffer()
		: undefined;

	const response = await fetch(target, {
		method: event.req.method,
		headers,
		body,
		redirect: 'manual',
	});

	setResponseStatus(event, response.status, response.statusText);

	for (const [key, value] of response.headers.entries()) {
		if (
			key === 'content-encoding' ||
			key === 'content-length' ||
			key === 'transfer-encoding'
		)
			continue;

		event.res.headers.append(key, value);
	}

	const responseBody = await response.arrayBuffer();
	return responseBody.byteLength > 0 ? new Uint8Array(responseBody) : null;
});
