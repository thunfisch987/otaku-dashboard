// ESLint's complementary config for `bun run lint:hybrid`.
// Oxlint owns standalone JS/TS files; ESLint retains Vue SFCs, which need
// Nuxt's template-aware rules and globals.
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
	{
		ignores: [
			'**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}',
			'convex/_generated/**',
			'convex/betterAuth/_generated/**',
		],
	},
	{
		rules: {
			'vue/html-self-closing': ['warn', { html: { void: 'always' } }],
			'@typescript-eslint/no-unused-vars': 'off',
		},
	},
);
