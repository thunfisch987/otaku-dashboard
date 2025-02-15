<template>
	<div class="flex justify-center align-middle m-20 flex-col">
		<h1 class="text-9xl text-center">PLEASE LOG IN</h1>
		<GoogleSignIn class="mx-auto" />
	</div>
</template>

<script setup lang="ts">
const { loggedIn, ready } = useUserSession();
if (ready.value) {
	if (loggedIn.value) {
		navigateTo('/dash/dashboard');
	}
}
</script>
