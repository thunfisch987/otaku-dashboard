/* eslint-disable node/prefer-global/process */
import type { GenericCtx } from '@convex-dev/better-auth';
import type { DataModel } from './_generated/dataModel';
import { passkey } from '@better-auth/passkey';
import { createClient } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { components } from './_generated/api';
import { query } from './_generated/server';
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
		plugins: [
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
		userId: v.optional(v.union(v.null(), v.string())),
	}),
	handler: async (ctx) => {
		return authComponent.getAuthUser(ctx);
	},
});
