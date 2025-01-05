// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxtjs/tailwindcss',
		'shadcn-nuxt',
		'@nuxt/eslint',
		'@nuxtjs/color-mode',
		'@nuxt/image',
		'@nuxthub/core',
		'nuxt-auth-utils',
		'nuxt-typed-router',
	],
	devtools: { enabled: true },
	app: {
		head: {
			charset: 'utf-8',
			viewport: 'width=device-width, initial-scale=1',
			title: 'Otaku-Dashboard',
			htmlAttrs: {
				lang: 'en',
			},
			meta: [
				{ name: 'color-scheme', content: 'dark' },
				{ name: 'theme-color', content: '#E11D48' },
			],
		},
	},
	colorMode: {
		preference: 'dark',
		fallback: 'dark',
		classSuffix: '',
	},
	devServer: { port: 3000 },
	future: {
		typescriptBundlerResolution: true,
	},
	experimental: {
		appManifest: true,
		headNext: true,
		writeEarlyHints: true,
		asyncContext: true,
		payloadExtraction: true,
	},
	compatibilityDate: '2025-01-05',
	nitro: {
		experimental: {
			tasks: true,
		},
	},
	hub: {
		database: true,
	},
	typescript: {
		shim: false,
		strict: true,
	},
	eslint: {
		config: {
			stylistic: {
				indent: 'tab',
				semi: true,
				quotes: 'single',
				braceStyle: '1tbs',
				quoteProps: 'as-needed',
				arrowParens: true,
			},
		},
	},
});
