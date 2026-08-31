import {} from '#convex/advanced';

export default defineNuxtPlugin(() => {
	// const convex = useConvexClient();
	const { user } = useUserSession();
	// const getToken = async () => {
	// 	if (user.value) {
	// 		return user.value.tokens.id_token;
	// 	}
	// 	return null;
	// };
	useConvexAuth({
		fetchToken: async () => user.value?.tokens.id_token ?? null,
	});
	// convex.setAuth(getToken);
});
