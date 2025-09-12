export default defineNuxtRouteMiddleware((to) => {
	const { loggedIn, user, clear: clearSession } = useUserSession();
	// if (import.meta.dev && to.path === '/dash/forms') {
	// 	return;
	// }
	if (to.path !== '/') {
		if (user.value && user.value.tokens.expires_at < Date.now()) {
			clearSession();
			return navigateTo('/');
		}
		if (!loggedIn.value) {
			return navigateTo('/');
		}
	}
});
