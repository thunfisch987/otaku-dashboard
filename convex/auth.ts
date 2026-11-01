/* eslint-disable node/prefer-global/process */
import type { GenericCtx } from '@convex-dev/better-auth';
import type { DataModel } from './_generated/dataModel';
import type { Id } from './_generated/dataModel';
import type { User } from 'better-auth';
import { passkey } from '@better-auth/passkey';
import { dash } from '@better-auth/infra';
import { createClient } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements } from 'better-auth/plugins/admin/access';
import { components, internal } from './_generated/api';
import {
	internalAction,
	internalMutation,
	mutation,
	query,
} from './_generated/server';
import authConfig from './auth.config';
import authSchema from './betterAuth/schema';
import {
	getAuthAllowedHosts,
	getPlaygroundSiteUrl,
	isGoogleAuthEnabled,
} from './env';
import { v } from 'convex/values';

const siteUrl = getPlaygroundSiteUrl();
const passkeyRpID = new URL(siteUrl).hostname;
const enableGoogleAuth = isGoogleAuthEnabled();
const useSecureCookies = siteUrl.startsWith('https://');
const allowedHosts = getAuthAllowedHosts();
const initialAdminEmail =
	process.env.BETTER_AUTH_INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
const infrastructureApiKey = process.env.BETTER_AUTH_API_KEY;

const approvalAccessControl = createAccessControl(defaultStatements);
const operatorRole = approvalAccessControl.newRole({
	user: [],
	session: [],
});
const approvalAdminRole = approvalAccessControl.newRole({
	user: ['list', 'get', 'ban'],
	session: [],
});

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

export const authComponent = createClient<DataModel, typeof authSchema>(
	components.betterAuth,
	{
		local: {
			schema: authSchema,
		},
	},
);

export function createAuthOptions(ctx: GenericCtx<DataModel>) {
	return {
		baseURL: {
			allowedHosts,
			protocol: 'auto' as const,
		},
		useSecureCookies,
		database: authComponent.adapter(ctx),
		...(enableGoogleAuth
			? {
					socialProviders: {
						google: {
							clientId: process.env.GOOGLE_CLIENT_ID!,
							clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
						},
					},
				}
			: {}),
		databaseHooks: {
			user: {
				create: {
					before: async (user: User & Record<string, unknown>) => {
						const isInitialAdmin =
							user.emailVerified &&
							!!initialAdminEmail &&
							user.email.trim().toLowerCase() ===
								initialAdminEmail;

						return {
							data: {
								...user,
								role: isInitialAdmin ? 'admin' : 'user',
								banned: !isInitialAdmin,
								banReason: isInitialAdmin
									? null
									: 'Waiting for operator approval',
								banExpires: null,
							},
						};
					},
				},
			},
		},
		plugins: [
			admin({
				ac: approvalAccessControl,
				roles: {
					admin: approvalAdminRole,
					user: operatorRole,
				},
				defaultRole: 'user',
				bannedUserMessage:
					'Your account is waiting for operator approval.',
			}),
			...(infrastructureApiKey
				? [dash({ apiKey: infrastructureApiKey })]
				: []),
			passkey({
				rpID: passkeyRpID,
				rpName: 'Otaku Dashboard',
			}),
			crossDomain({ siteUrl }),
			convex({ authConfig }),
		],
	};
}

export function createAuth(ctx: GenericCtx<DataModel>) {
	return betterAuth(createAuthOptions(ctx));
}

export const getCurrentUser = query({
	args: {},
	returns: v.object({
		_id: v.string(),
		_creationTime: v.number(),
		name: v.string(),
		email: v.string(),
		emailVerified: v.boolean(),
		image: v.optional(v.union(v.null(), v.string())),
		createdAt: v.number(),
		updatedAt: v.number(),
		role: v.optional(v.union(v.null(), v.string())),
		banned: v.optional(v.union(v.null(), v.boolean())),
		banReason: v.optional(v.union(v.null(), v.string())),
		banExpires: v.optional(v.union(v.null(), v.number())),
		userId: v.optional(v.union(v.null(), v.string())),
	}),
	handler: async (ctx) => {
		return authComponent.getAuthUser(ctx);
	},
});

export const getCachedAvatarUrl = query({
	args: {},
	returns: v.union(v.string(), v.null()),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const authUser = await authComponent.getAuthUser(ctx);
		const sourceUrl = authUser.image;
		if (!sourceUrl) return null;

		const cache = await ctx.db
			.query('userAvatarCache')
			.withIndex('by_authId', (q) =>
				q.eq('authId', identity.tokenIdentifier),
			)
			.unique();

		if (!cache || cache.sourceUrl !== sourceUrl || !cache.storageId)
			return null;
		return (await ctx.storage.getUrl(cache.storageId)) ?? null;
	},
});

export const ensureCachedAvatar = mutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const authUser = await authComponent.getAuthUser(ctx);
		const sourceUrl = authUser.image;
		if (!sourceUrl) return null;

		try {
			validateGoogleAvatarUrl(sourceUrl);
		} catch {
			return null;
		}

		const existing = await ctx.db
			.query('userAvatarCache')
			.withIndex('by_authId', (q) =>
				q.eq('authId', identity.tokenIdentifier),
			)
			.unique();
		const currentStorageUrl = existing?.storageId
			? await ctx.storage.getUrl(existing.storageId)
			: null;

		if (
			existing?.sourceUrl === sourceUrl &&
			(currentStorageUrl || existing.pendingUrl === sourceUrl)
		) {
			return null;
		}

		if (existing?.storageId) await ctx.storage.delete(existing.storageId);
		if (existing) {
			await ctx.db.patch(existing._id, {
				sourceUrl,
				storageId: undefined,
				pendingUrl: sourceUrl,
			});
		} else {
			await ctx.db.insert('userAvatarCache', {
				authId: identity.tokenIdentifier,
				sourceUrl,
				pendingUrl: sourceUrl,
			});
		}

		await ctx.scheduler.runAfter(0, internal.auth.cacheGoogleAvatar, {
			authId: identity.tokenIdentifier,
			sourceUrl,
		});
		return null;
	},
});

export const cacheGoogleAvatar = internalAction({
	args: { authId: v.string(), sourceUrl: v.string() },
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
			await ctx.runMutation(internal.auth.saveCachedAvatar, {
				authId: args.authId,
				sourceUrl: args.sourceUrl,
				storageId,
			});
		} catch (error) {
			if (storageId) await ctx.storage.delete(storageId);
			await ctx.runMutation(internal.auth.markAvatarCacheFailed, {
				authId: args.authId,
				sourceUrl: args.sourceUrl,
			});
			console.warn(
				'Could not cache a Google avatar',
				error instanceof Error ? error.message : 'Unknown error',
			);
		}
		return null;
	},
});

export const saveCachedAvatar = internalMutation({
	args: {
		authId: v.string(),
		sourceUrl: v.string(),
		storageId: v.id('_storage'),
	},
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const cache = await ctx.db
			.query('userAvatarCache')
			.withIndex('by_authId', (q) => q.eq('authId', args.authId))
			.unique();
		if (
			!cache ||
			cache.sourceUrl !== args.sourceUrl ||
			cache.pendingUrl !== args.sourceUrl
		) {
			await ctx.storage.delete(args.storageId);
			return false;
		}

		if (cache.storageId && cache.storageId !== args.storageId) {
			await ctx.storage.delete(cache.storageId);
		}
		await ctx.db.patch(cache._id, {
			storageId: args.storageId,
			pendingUrl: undefined,
		});
		return true;
	},
});

export const markAvatarCacheFailed = internalMutation({
	args: { authId: v.string(), sourceUrl: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const cache = await ctx.db
			.query('userAvatarCache')
			.withIndex('by_authId', (q) => q.eq('authId', args.authId))
			.unique();
		if (cache?.pendingUrl === args.sourceUrl) {
			await ctx.db.patch(cache._id, { pendingUrl: undefined });
		}
		return null;
	},
});
