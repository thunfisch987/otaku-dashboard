<template>
	<div>
		<UTable
			:data="users"
			class="flex-1"
		/>
		<div class="flex justify-center py-4">
			<UButton
				v-if="convexAuthenticated && !isDone"
				:loading="isLoadingMore"
				:disabled="isLoadingMore"
				@click="loadMore"
			>
				Load more users
			</UButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { api } from '#convex/api';

const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useAppConvexAuth();
const usersQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);

const {
	data: users,
	isDone,
	isLoadingMore,
	loadMore,
	error,
	suspense,
} = useConvexPaginatedQuery(api.users.list, usersQueryArgs, {
	numItems: 100,
});

await suspense();
</script>
