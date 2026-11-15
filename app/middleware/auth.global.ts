export default defineNuxtRouteMiddleware(async (to) => {
	if (import.meta.server) return;

	if (to.path === '/') {
		// Sent a signed-in operator who opens the app root straight to the
		// dashboard. The page itself handles the case where the session is
		// still loading when this runs.
		const { user, ready } = useUserSession();
		if (ready.value && user.value) {
			return navigateTo('/dash/dashboard', { replace: true });
		}
		return;
	}

	if (
		to.path === '/auth/error' ||
		to.path === '/privacy' ||
		to.path.startsWith('/preorder/')
	) {
		return;
	}

	const { user, ready, waitForSession } = useUserSession();

	if (!ready.value) await waitForSession();

	if (!user.value) return navigateTo('/');
});
