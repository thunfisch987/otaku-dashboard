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

const { user } = useUserSession();

const {
	data: users,
	isPending: pending,
	error,
	suspense,
} = useConvexQuery(api.users.list, {});

await suspense();
</script>
