import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { authComponent } from './auth';

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
			await ctx.db.patch(existing._id, {
				...profile,
				authId: identity.tokenIdentifier,
			});

			return existing._id;
		}

		return await ctx.db.insert('users', {
			...profile,
			authId: identity.tokenIdentifier,
		});
	},
});

export const list = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Not authenticated');
		}

		return await ctx.db.query('users').take(100);
	},
});
