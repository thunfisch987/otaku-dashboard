import { api } from '#convex/api';

export default defineNuxtPlugin(() => {
	const { user, ready } = useUserSession();
	const { isAuthenticated } = useConvexAuth();
	const { mutate } = useConvexMutation(api.users.upsert);

	let syncedUserId: string | undefined;
	let syncInFlight: Promise<void> | undefined;

	const syncUser = async () => {
		if (!ready.value || !isAuthenticated.value || !user.value) {
			syncedUserId = undefined;
			return;
		}

		if (syncedUserId === user.value.id || syncInFlight) return;

		const userId = user.value.id;
		syncInFlight = mutate({})
			.then(() => {
				syncedUserId = userId;
			})
			.catch((error: unknown) => {
				console.error(
					'[auth] Failed to sync the application user profile',
					error,
				);
			})
			.finally(() => {
				syncInFlight = undefined;
			});

		await syncInFlight;
	};

	watch([ready, isAuthenticated, () => user.value?.id], syncUser, {
		immediate: true,
	});
});
