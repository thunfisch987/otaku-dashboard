<template>
	<div class="flex justify-center align-middle m-20 flex-col">
		<h1 class="text-9xl text-center">PLEASE LOG IN</h1>
		<LazyGoogleSignIn class="mx-auto" />
		<UButton
			external
			to="/api/auth/osu"
			>osu!</UButton
		>
	</div>
</template>

<script setup lang="ts"></script>
