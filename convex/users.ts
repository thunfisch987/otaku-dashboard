import { internal } from './_generated/api';
import { mutation, query } from './_generated/server';
import {
	paginationOptsValidator,
	paginationResultValidator,
} from 'convex/server';
import { v } from 'convex/values';
import { authComponent } from './auth';
import schema from './schema';

export const upsert = mutation({
	args: {},
	returns: v.id('users'),

	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new Error('Not authenticated');
		}
		const authUser = await authComponent.getAuthUser(ctx);
		const profile = {
			email: authUser.email,
			name: authUser.name,
			...(authUser.image ? { avatar: authUser.image } : {}),
		};

		let existing = await ctx.db
			.query('users')
			.withIndex('by_authId', (q) =>
				q.eq('authId', identity.tokenIdentifier),
			)
			.unique();

		if (!existing) {
			existing = await ctx.db
				.query('users')
				.withIndex('by_email', (q) => q.eq('email', authUser.email))
				.first();
		}

		if (existing) {
			const shouldCacheAvatar =
				!!authUser.image &&
				(existing.avatar !== authUser.image ||
					!existing.avatarStorageId) &&
				existing.avatarCachePendingUrl !== authUser.image;

			await ctx.db.patch(existing._id, {
				...profile,
				authId: identity.tokenIdentifier,
				...(shouldCacheAvatar
					? { avatarCachePendingUrl: authUser.image }
					: {}),
			});

			if (shouldCacheAvatar && authUser.image) {
				await ctx.scheduler.runAfter(
					0,
					internal.profilepics.cacheGoogleAvatar,
					{ userId: existing._id, sourceUrl: authUser.image },
				);
			}

			return existing._id;
		}

		const userId = await ctx.db.insert('users', {
			...profile,
			authId: identity.tokenIdentifier,
			...(authUser.image
				? { avatarCachePendingUrl: authUser.image }
				: {}),
		});

		if (authUser.image) {
			await ctx.scheduler.runAfter(
				0,
				internal.profilepics.cacheGoogleAvatar,
				{ userId, sourceUrl: authUser.image },
			);
		}

		return userId;
	},
});

export const getCachedAvatarUrl = query({
	args: {},
	returns: v.union(v.string(), v.null()),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const user = await ctx.db
			.query('users')
			.withIndex('by_authId', (q) =>
				q.eq('authId', identity.tokenIdentifier),
			)
			.unique();

		if (!user?.avatarStorageId) return null;
		return await ctx.storage.getUrl(user.avatarStorageId);
	},
});

export const list = query({
	args: { paginationOpts: paginationOptsValidator },
	returns: paginationResultValidator(schema.doc('users')),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		return await ctx.db.query('users').paginate(args.paginationOpts);
	},
});
