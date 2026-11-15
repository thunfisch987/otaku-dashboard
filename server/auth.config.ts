// Default server config scaffolded by @nuxtjs/better-auth. Unused here:
// the module runs in clientOnly mode and the auth server lives in Convex
// (@convex-dev/better-auth), served through nuxt-convex's /api/auth/**
// proxy. Kept so the module does not regenerate this file on prepare.
import { defineServerAuth } from '@nuxtjs/better-auth/config';

export default defineServerAuth({
	emailAndPassword: { enabled: true },
});
