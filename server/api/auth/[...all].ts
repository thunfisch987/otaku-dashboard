import {
	createError,
	defineEventHandler,
	getRequestHeaders,
	useRuntimeConfig,
} from 'nuxt/server';

const MAX_AUTH_BODY_BYTES = 1024 * 1024;
const AUTH_UPSTREAM_TIMEOUT_MS = 15_000;
const HOP_BY_HOP_HEADERS = [
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
];

async function readRequestBody(request: Request): Promise<ArrayBuffer> {
	const declaredLength = Number(request.headers.get('content-length'));
	if (
		Number.isFinite(declaredLength) &&
		declaredLength > MAX_AUTH_BODY_BYTES
	) {
		throw createError({
			statusCode: 413,
			statusMessage: 'Authentication request body is too large',
		});
	}

	const chunks: Uint8Array[] = [];
	let totalBytes = 0;
	const reader = request.body?.getReader();
	if (!reader) return new ArrayBuffer(0);
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			const bytes = value;
			totalBytes += bytes.byteLength;
			if (totalBytes > MAX_AUTH_BODY_BYTES) {
				await reader.cancel().catch(() => undefined);
				throw createError({
					statusCode: 413,
					statusMessage: 'Authentication request body is too large',
				});
			}
			chunks.push(bytes);
		}
	} finally {
		reader.releaseLock();
	}

	const body = new ArrayBuffer(totalBytes);
	const output = new Uint8Array(body);
	let offset = 0;
	for (const chunk of chunks) {
		output.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return body;
}

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
	const connectionHeaders = headers.get('connection');
	for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
	for (const header of connectionHeaders?.split(',') ?? []) {
		headers.delete(header.trim());
	}
	headers.set('x-forwarded-host', requestUrl.host);
	headers.set('x-forwarded-proto', requestUrl.protocol.replace(/:$/, ''));
	headers.set('x-better-auth-forwarded-host', requestUrl.host);
	headers.set(
		'x-better-auth-forwarded-proto',
		requestUrl.protocol.replace(/:$/, ''),
	);

	const body = ['PATCH', 'POST', 'PUT', 'DELETE'].includes(event.req.method)
		? await readRequestBody(event.req)
		: undefined;

	let response: Response;
	try {
		response = await fetch(target, {
			method: event.req.method,
			headers,
			body,
			redirect: 'manual',
			signal: AbortSignal.timeout(AUTH_UPSTREAM_TIMEOUT_MS),
		});
	} catch (error) {
		throw createError({
			statusCode:
				error instanceof Error && error.name === 'TimeoutError'
					? 504
					: 502,
			statusMessage:
				error instanceof Error && error.name === 'TimeoutError'
					? 'Authentication service timed out'
					: 'Authentication service is unavailable',
		});
	}

	const responseHeaders = new Headers(response.headers);
	const responseConnectionHeaders = responseHeaders.get('connection');
	for (const header of [
		...HOP_BY_HOP_HEADERS,
		'content-encoding',
		'content-length',
	]) {
		responseHeaders.delete(header);
	}
	for (const header of responseConnectionHeaders?.split(',') ?? []) {
		responseHeaders.delete(header.trim());
	}

	const responseBody = [204, 205, 304].includes(response.status)
		? null
		: response.body;
	return new Response(responseBody, {
		status: response.status,
		statusText: response.statusText,
		headers: responseHeaders,
	});
});
