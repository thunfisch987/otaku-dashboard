// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxt/eslint',
		'@nuxt/image',
		'nuxt-auth-utils',
		'nuxt-typed-router',
		'@nuxt/ui',
		'convex-nuxt',
		'@compodium/nuxt',
	],
	css: ['~/assets/css/main.css'],
	convex: {
		url: process.env.CONVEX_URL,
	},
	devtools: { enabled: true },
	app: {
		head: {
			charset: 'utf-8',
			viewport: 'width=device-width, initial-scale=1',
			title: 'Otaku-Dashboard',
			htmlAttrs: {
				lang: 'en',
			},
			meta: [],
		},
	},
	devServer: { port: 3001 },
	future: {
		compatibilityVersion: 4,
	},
	experimental: {
		writeEarlyHints: true,
		asyncContext: true,
		viteEnvironmentApi: true,
		extractAsyncDataHandlers: true,
		typescriptPlugin: true,
	},
	compatibilityDate: '2025-06-03',
	nitro: {
		experimental: {
			tasks: true,
			openAPI: true,
		},
	},
	ui: {
		colorMode: true,
	},
});
