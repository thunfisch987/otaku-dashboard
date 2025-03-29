export default defineNuxtRouteMiddleware((to) => {
	const { loggedIn } = useUserSession();
	if (to.path === '/dash/forms') {
		return;
	}
	if (!loggedIn.value && to.path !== '/') {
		return navigateTo('/');
	}
});
