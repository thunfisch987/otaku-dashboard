import { defineConfig } from 'vite-plus';

export default defineConfig({
	staged: {
		'*': 'vp check --fix',
	},
	lint: {
		jsPlugins: [
			{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
		],
		rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
		options: { typeAware: true, typeCheck: true },
	},
	fmt: {
		tabWidth: 4,
		useTabs: true,
		semi: true,
		singleQuote: true,
		quoteProps: 'as-needed',
		trailingComma: 'all',
		bracketSpacing: true,
		arrowParens: 'always',
		bracketSameLine: false,
		singleAttributePerLine: true,
		printWidth: 80,
		sortPackageJson: false,
		ignorePatterns: [],
	},
});
