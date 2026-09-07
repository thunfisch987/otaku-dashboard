<template>
	<UButton
		icon="i-lucide-fingerprint"
		:loading="isPending"
		:disabled="isPending"
		variant="outline"
		@click="signInWithPasskey"
	>
		Sign in with passkey
	</UButton>
</template>

<script setup lang="ts">
const toast = useToast();
const { client } = useUserSession();
const isPending = ref(false);

async function signInWithPasskey() {
	if (!client || isPending.value) return;

	isPending.value = true;
	try {
		const result = await client.signIn.passkey();

		if (result.error) {
			toast.add({
				title: 'Passkey sign-in failed',
				description: result.error.message ?? 'Please try again.',
				color: 'error',
			});
			return;
		}

		window.location.replace('/dash/dashboard');
	} catch (error) {
		toast.add({
			title: 'Passkey sign-in failed',
			description:
				error instanceof Error ? error.message : 'Please try again.',
			color: 'error',
		});
	} finally {
		isPending.value = false;
	}
}
</script>
