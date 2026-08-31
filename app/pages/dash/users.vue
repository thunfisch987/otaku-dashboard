<template>
	<div>
		<pre>{{ users }}</pre>
	</div>
</template>

<script setup lang="ts">
import { api } from '~~/convex/_generated/api';

const { user } = useUserSession();

const {
	data: users,
	isPending: pending,
	error,
	suspense,
} = useConvexQuery(api.users.list);

await suspense();
</script>
