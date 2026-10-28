export default defineNuxtRouteMiddleware(async (to) => {
	if (
		import.meta.server ||
		to.path === '/' ||
		to.path === '/privacy' ||
		to.path.startsWith('/preorder/')
	) {
		return;
	}

	const { user, ready, waitForSession } = useUserSession();

	if (!ready.value) await waitForSession();

	if (!user.value) return navigateTo('/');
});
