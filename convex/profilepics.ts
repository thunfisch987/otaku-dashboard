import { internal } from './_generated/api';
import { internalAction, internalMutation } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { v } from 'convex/values';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_TIMEOUT_MS = 10_000;
const GOOGLE_IMAGE_HOST = /(^|\.)googleusercontent\.com$/i;
const ALLOWED_IMAGE_TYPES = new Set([
	'image/avif',
	'image/gif',
	'image/jpeg',
	'image/png',
	'image/webp',
]);

function validateGoogleAvatarUrl(sourceUrl: string): URL {
	const url = new URL(sourceUrl);
	if (
		url.protocol !== 'https:' ||
		!GOOGLE_IMAGE_HOST.test(url.hostname) ||
		url.username ||
		url.password
	) {
		throw new Error(
			'The profile image URL is not an allowed Google image URL',
		);
	}
	return url;
}

async function readBoundedImage(response: Response): Promise<Blob> {
	if (!response.ok) {
		throw new Error(
			`Google profile image request failed (${response.status})`,
		);
	}

	const contentType = response.headers
		.get('content-type')
		?.split(';', 1)[0]
		?.trim()
		.toLowerCase();
	if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
		throw new Error('Google returned an unsupported profile image type');
	}

	const declaredLength = Number(response.headers.get('content-length'));
	if (Number.isFinite(declaredLength) && declaredLength > MAX_AVATAR_BYTES) {
		throw new Error('Google profile image is too large');
	}

	if (!response.body)
		throw new Error('Google returned an empty profile image');
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let totalBytes = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			totalBytes += value.byteLength;
			if (totalBytes > MAX_AVATAR_BYTES) {
				await reader.cancel();
				throw new Error('Google profile image is too large');
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}

	if (totalBytes === 0)
		throw new Error('Google returned an empty profile image');
	const bytes = new Uint8Array(totalBytes);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new Blob([bytes.buffer as ArrayBuffer], { type: contentType });
}

export const cacheGoogleAvatar = internalAction({
	args: { userId: v.id('users'), sourceUrl: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		let storageId: Id<'_storage'> | undefined;
		try {
			const url = validateGoogleAvatarUrl(args.sourceUrl);
			const response = await fetch(url, {
				redirect: 'error',
				signal: AbortSignal.timeout(AVATAR_TIMEOUT_MS),
			});
			const image = await readBoundedImage(response);
			storageId = await ctx.storage.store(image);
			await ctx.runMutation(internal.profilepics.saveCachedAvatar, {
				userId: args.userId,
				sourceUrl: args.sourceUrl,
				storageId,
			});
		} catch (error) {
			if (storageId) await ctx.storage.delete(storageId);
			await ctx.runMutation(internal.profilepics.markAvatarCacheFailed, {
				userId: args.userId,
				sourceUrl: args.sourceUrl,
			});
			console.warn(
				'Could not cache a Google profile image',
				error instanceof Error ? error.message : 'Unknown error',
			);
		}
		return null;
	},
});

export const saveCachedAvatar = internalMutation({
	args: {
		userId: v.id('users'),
		sourceUrl: v.string(),
		storageId: v.id('_storage'),
	},
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user || user.avatar !== args.sourceUrl) {
			await ctx.storage.delete(args.storageId);
			if (user?.avatarCachePendingUrl === args.sourceUrl) {
				await ctx.db.patch(args.userId, {
					avatarCachePendingUrl: null,
				});
			}
			return false;
		}

		if (user.avatarStorageId && user.avatarStorageId !== args.storageId) {
			await ctx.storage.delete(user.avatarStorageId);
		}
		await ctx.db.patch(args.userId, {
			avatarStorageId: args.storageId,
			avatarCachePendingUrl: null,
		});
		return true;
	},
});

export const markAvatarCacheFailed = internalMutation({
	args: { userId: v.id('users'), sourceUrl: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (user?.avatarCachePendingUrl === args.sourceUrl) {
			await ctx.db.patch(args.userId, { avatarCachePendingUrl: null });
		}
		return null;
	},
});
