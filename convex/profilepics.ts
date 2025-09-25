import { action, internalMutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

export const generateAndStore = action({
	args: { url: v.string() },
	handler: async (ctx, args) => {
		// Not shown: generate imageUrl from `prompt`
		const imageUrl = args.url;

		// Download the image
		const response = await fetch(imageUrl);
		const image = await response.blob();

		// Store the image in Convex
		const storageId: Id<'_storage'> = await ctx.storage.store(image);

		// Write `storageId` to a document
		await ctx.runMutation(internal.profilepics.storeResult, {
			storageId,
			url: args.url,
		});
	},
});

export const storeResult = internalMutation({
	args: {
		storageId: v.id('_storage'),
		url: v.string(),
	},
	handler: async (ctx, args) => {
		const { storageId, url } = args;
		await ctx.db.insert('images', { storageId, url });
	},
});
