import { useConvexAuth } from '#convex';

// App-wide view of the Convex auth state. vue-convex's shared runtime state
// is fed by nuxt-convex's Better Auth integration: the SSR cookie→JWT
// exchange on the server and the built-in client token plugin
// (useUserSession → /api/auth/convex/token → useConvexAuth) on the client.
export function useAppConvexAuth() {
	return useConvexAuth();
}
