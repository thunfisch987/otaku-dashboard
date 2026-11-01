<template>
	<div
		class="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-12 text-center"
	>
		<div
			class="flex size-12 items-center justify-center rounded-full bg-error/10 text-error"
			aria-hidden="true"
		>
			<UIcon
				name="i-lucide-triangle-alert"
				class="size-6"
			/>
		</div>
		<div class="space-y-2">
			<h1 class="text-2xl font-semibold text-highlighted">
				Sign-in didn’t complete
			</h1>
			<p class="text-muted">
				The sign-in was cancelled or something went wrong. You can
				return to the sign-in page and try again.
			</p>
		</div>
		<UButton
			to="/"
			size="lg"
			>Back to sign in</UButton
		>
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	layout: 'public',
});
</script>
