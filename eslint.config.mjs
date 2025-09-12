// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
        rules: {
            'vue/html-self-closing': ['warn', {html: {void: 'always'}}],
            '@typescript-eslint/no-unused-vars': 'off'
        }
    });
