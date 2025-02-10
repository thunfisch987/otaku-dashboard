<template>
	<div class="flex justify-center align-middle m-20 flex-col">
		<h1 class="text-9xl text-center">PLEASE LOG IN</h1>
		<GoogleSignIn class="mx-auto" />
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	middleware: ['logged'],
});
</script>

<style></style>
