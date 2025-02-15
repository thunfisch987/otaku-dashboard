export default defineNuxtRouteMiddleware((from) => {
	if (from.path === '/') {
		const { loggedIn } = useUserSession();
		if (loggedIn.value) {
			return navigateTo('/dash/dashboard');
		}
	}
});
