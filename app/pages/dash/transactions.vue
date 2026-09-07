<template>
	<div>
		<UTable
			:data="transactions"
			class="flex-1"
		/>
	</div>
</template>

<script setup lang="ts">
import { api } from '#convex/api';

const { user } = useUserSession();
const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useConvexAuth();
const transactionsQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);

const {
	data: transactions,
	isPending: pending,
	error,
	suspense,
} = useConvexQuery(api.transactions.list, transactionsQueryArgs, {
	server: false,
});

await suspense();
</script>
