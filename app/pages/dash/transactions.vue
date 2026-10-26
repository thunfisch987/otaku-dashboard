<template>
	<div>
		<UTable
			:data="transactions"
			class="flex-1"
		/>
		<div class="flex justify-center py-4">
			<UButton
				v-if="convexAuthenticated && !isDone"
				:loading="isLoadingMore"
				:disabled="isLoadingMore"
				@click="loadMore"
			>
				Load more transactions
			</UButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { api } from '#convex/api';

const { user } = useUserSession();
const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useAppConvexAuth();
const transactionsQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);

const {
	data: transactions,
	isDone,
	isLoadingMore,
	loadMore,
	error,
	suspense,
} = useConvexPaginatedQuery(api.transactions.list, transactionsQueryArgs, {
	numItems: 100,
});

await suspense();
</script>
