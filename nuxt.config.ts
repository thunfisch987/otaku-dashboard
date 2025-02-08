// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxt/eslint',
		'@nuxt/image',
		'@nuxthub/core',
		'nuxt-auth-utils',
		'nuxt-typed-router',
		'@nuxt/ui',
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
	routeRules: {
		'/': { prerender: true },
		'/dash/dashboard.vue': { prerender: true },
		'/dash/forms.vue': { prerender: true },
		'/dash/inventory.vue': { prerender: true },
		'/dash/pointofsale.vue': { prerender: true },
	},
	devServer: { port: 3001 },
	future: {
		compatibilityVersion: 4,
	},
	experimental: {
		writeEarlyHints: true,
		asyncContext: true,
	},
	compatibilityDate: '2025-01-26',
	nitro: {
		experimental: {
			tasks: true,
			openAPI: true,
		},
	},
	hub: {
		database: true,
	},
});
