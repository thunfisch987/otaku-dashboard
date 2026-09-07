<template>
	<div>
		<UTable
			:data="users"
			class="flex-1"
		/>
	</div>
</template>

<script setup lang="ts">
import { api } from '#convex/api';

const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useConvexAuth();
const usersQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);

const {
	data: users,
	isPending: pending,
	error,
	suspense,
} = useConvexQuery(api.users.list, usersQueryArgs, { server: false });

await suspense();
</script>
