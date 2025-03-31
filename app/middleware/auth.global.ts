export default defineNuxtRouteMiddleware((to) => {
	const { loggedIn } = useUserSession();
	if (import.meta.dev && to.path === '/dash/forms') {
		return;
	}
	if (!loggedIn.value && to.path !== '/') {
		return navigateTo('/');
	}
});
