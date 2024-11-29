// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxtjs/tailwindcss',
		'shadcn-nuxt',
		'@nuxt/eslint',
		'@nuxtjs/color-mode',
		'@nuxt/image',
		'@vite-pwa/nuxt',
		'@nuxthub/core',
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
	compatibilityDate: '2024-11-29',
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
	pwa: {
		devOptions: {
			enabled: true,
		},
		manifest: {
			icons: [
				{
					src: 'pwa-64x64.png',
					sizes: '64x64',
					type: 'image/png',
				},
				{
					src: 'pwa-192x192.png',
					sizes: '192x192',
					type: 'image/png',
				},
				{
					src: 'pwa-512x512.png',
					sizes: '512x512',
					type: 'image/png',
				},
				{
					src: 'maskable-icon-512x512.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'maskable',
				},
			],
			theme_color: '#E11D48',
		},
	},
});
