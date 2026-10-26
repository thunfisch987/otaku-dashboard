declare module '*.vue' {
	import type { DefineComponent } from 'vue';
	const component: DefineComponent<{}, {}, unknown>;
	export default component;
}

// In clientOnly mode the nuxt-better-auth module does not generate its
// social-provider type registry, so `useSignIn('social')` would otherwise
// require `provider: never`. Declare the providers this app actually enables.
declare module '#nuxt-better-auth' {
	interface AuthSocialProviderRegistry {
		ids: 'google';
	}
}
