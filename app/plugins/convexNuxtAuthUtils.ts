export default defineNuxtPlugin((nuxtApp) => {
	const convex = useConvexClient();
	const { user } = useUserSession();
	const getToken = async () => {
		if (user.value) {
			return user.value.tokens.id_token;
		}
		return null;
	};
	convex.setAuth(getToken);
});
