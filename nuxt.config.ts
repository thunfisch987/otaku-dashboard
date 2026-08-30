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
		'@vite-pwa/nuxt',
	],
	css: ['~/assets/css/main.css'],
	convex: {
		url: import.meta.env.CONVEX_URL,
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
			meta: [{ name: 'description', content: 'Otaku Dashboard' }],
		},
	},
	devServer: { port: 3001 },
	future: {
		compatibilityVersion: 5,
	},
	experimental: {
		writeEarlyHints: true,
		asyncContext: true,
		viteEnvironmentApi: true,
		extractAsyncDataHandlers: true,
		typescriptPlugin: true,
	},
	compatibilityDate: '2026-08-30',
	nitro: {
		experimental: {
			tasks: true,
			openAPI: true,
		},
	},
	ui: {
		colorMode: true,
		experimental: {
			componentDetection: true,
		},
	},
	pwa: {
		useCredentials: true,
	},
	vite: {
		optimizeDeps: {
			include: [
				'@internationalized/date',
				'@tanstack/vue-table',
				'@vue/devtools-core',
				'@vue/devtools-kit',
				'convex-vue',
				'convex/server',
				'zod/mini',
			],
		},
	},
});
