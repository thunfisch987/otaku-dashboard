export default defineNuxtPlugin({
	name: 'convex-better-auth-token',
	enforce: 'post',
	setup() {
		const { client } = useUserSession();
		const route = useRoute();
		let oneTimeTokenPromise: Promise<void> | undefined;

		const consumeOneTimeToken = async () => {
			const token =
				typeof route.query.ott === 'string'
					? route.query.ott
					: undefined;

			if (!token || !client) return;

			oneTimeTokenPromise ??= (async () => {
				const authClient = client as typeof client & {
					crossDomain?: {
						oneTimeToken: {
							verify: (args: { token: string }) => Promise<{
								data?: { session?: { token?: string } };
							}>;
						};
					};
				};

				const result =
					await authClient.crossDomain?.oneTimeToken.verify({
						token,
					});
				const sessionToken = result?.data?.session?.token;

				if (sessionToken) {
					await authClient.getSession({
						fetchOptions: {
							headers: {
								Authorization: `Bearer ${sessionToken}`,
							},
						},
					});
				}

				const cleanUrl = new URL(window.location.href);
				cleanUrl.searchParams.delete('ott');
				window.history.replaceState({}, '', cleanUrl);
			})();

			await oneTimeTokenPromise;
		};

		useConvexAuth({
			fetchToken: async () => {
				await consumeOneTimeToken();
				const cookie = client?.getCookie?.();
				const response = await $fetch<{ token?: string }>(
					'/api/auth/convex/token',
					{
						credentials: 'include',
						headers: cookie
							? { 'Better-Auth-Cookie': cookie }
							: undefined,
					},
				);

				return response.token ?? null;
			},
		});
	},
});
