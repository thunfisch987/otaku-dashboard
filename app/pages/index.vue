<template>
	<div class="flex justify-center align-middle m-20 flex-col">
		<h1 class="text-9xl text-center">PLEASE LOG IN</h1>
		<UButton
			to="/api/auth/google"
			external
			variant="solid"
			icon="i-lucide-log-in"
			class="max-w-max m-auto"
			size="xl"
		>
			Login
		</UButton>
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	middleware: ['logged'],
});
</script>

<style></style>
