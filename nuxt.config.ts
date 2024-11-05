// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxtjs/tailwindcss',
		'shadcn-nuxt',
		'@nuxt/eslint',
		'@nuxtjs/color-mode',
	],
	devtools: { enabled: true },
	colorMode: {
		preference: 'dark',
		fallback: 'dark',
		classSuffix: ''
	},
	compatibilityDate: '2024-11-05',
	eslint: {
		config: {
			stylistic: {
				indent: 'tab',
				semi: true,
				braceStyle: '1tbs',
				quoteProps: 'as-needed',
				arrowParens: true,

			},
		},
	},
	// builder: 'rspack'
});

