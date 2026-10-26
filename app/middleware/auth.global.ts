export default defineNuxtRouteMiddleware(async (to) => {
	if (import.meta.server || to.path === '/' || to.path === '/privacy') return;

	const { user, ready, waitForSession } = useUserSession();

	if (!ready.value) await waitForSession();

	if (!user.value) return navigateTo('/');
});
