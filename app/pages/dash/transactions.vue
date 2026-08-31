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

const {
	data: transactions,
	isPending: pending,
	error,
	suspense,
} = useConvexQuery(api.transactions.list, {});

await suspense();
</script>
