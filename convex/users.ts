import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const upsert = mutation({
	args: {
		email: v.string(),
		name: v.string(),
		avatar: v.optional(v.string()),
	},

	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new Error('Not authenticated');
		}

		const existing = await ctx.db
			.query('users')
			.withIndex('by_authId', (q) =>
				q.eq('authId', identity.tokenIdentifier),
			)
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				email: args.email,
				name: args.name,
				avatar: args.avatar,
			});

			return existing._id;
		}

		return await ctx.db.insert('users', {
			authId: identity.tokenIdentifier,
			email: args.email,
			name: args.name,
			avatar: args.avatar,
		});
	},
});

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('users').collect();
	},
});
