// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxt/eslint',
		'@nuxt/image',
		'@nuxthub/core',
		'nuxt-auth-utils',
		'nuxt-typed-router',
		'@nuxt/ui',
		'compodium',
		'@vueuse/nuxt',
	],
	css: ['~/assets/css/main.css'],
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
	},
	compatibilityDate: '2025-06-03',
	nitro: {
		experimental: {
			tasks: true,
			openAPI: true,
			websocket: true,
		},
	},
	hub: {
		database: true,
		workers: true,
	},
	ui: {
		colorMode: true,
	},
});
