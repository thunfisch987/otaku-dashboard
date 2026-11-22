<template>
	<div
		class="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16"
	>
		<p
			v-if="status === 'checking' || status === 'redirecting'"
			class="flex items-center justify-center gap-2 py-3 text-muted"
			role="status"
		>
			<UIcon
				name="i-lucide-loader-circle"
				class="size-5 animate-spin"
			/>
			<span>
				{{
					status === 'redirecting'
						? 'Taking you to the dashboard…'
						: 'Checking your session…'
				}}
			</span>
		</p>
		<div
			v-else
			class="sign-in-panel flex w-full flex-col items-stretch gap-3"
		>
			<div
				v-if="status === 'error'"
				class="rounded-lg border border-default bg-elevated p-3"
				role="alert"
			>
				<p class="text-sm text-muted">
					Your session could not be checked. Retry, or sign in again.
				</p>
				<UButton
					variant="outline"
					size="xl"
					icon="i-lucide-refresh-cw"
					class="mt-2 min-h-12 w-full justify-center"
					@click="checkSession"
				>
					Try again
				</UButton>
			</div>
			<LazyGoogleSignIn
				large
				class="w-full"
			/>
			<LazyPasskeySignIn
				size="xl"
				class="w-full min-h-12"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
type SignInStatus = 'checking' | 'redirecting' | 'signed-out' | 'error';

const SESSION_CHECK_TIMEOUT_MS = 8000;

const { user, fetchSession } = useUserSession();

// The session resolves on the client only. Render the same pending state on
// the server and on the first client render so returning operators never see
// the sign-in buttons flash before the redirect.
const status = ref<SignInStatus>('checking');

function redirectToDashboard() {
	status.value = 'redirecting';
	void navigateTo('/dash/dashboard', { replace: true });
}

// Redirect only after hydration: the session is already resolved on the
// client, so changing the status during setup would make the first client
// render differ from the server's pending copy.
watch(user, (currentUser) => {
	if (!currentUser) return;
	redirectToDashboard();
});

async function checkSession() {
	status.value = 'checking';

	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(
			() => reject(new Error('Session check timed out')),
			SESSION_CHECK_TIMEOUT_MS,
		);
	});

	try {
		// Check the session directly instead of trusting the auth module's
		// `ready` flag: on this prerendered route that flag can be stale or
		// reset during hydration, which would show sign-in to a signed-in
		// operator (or leave the page pending).
		await Promise.race([fetchSession(), timeout]);
	} catch {
		// Never leave the page on the spinner: an offline or hung auth server
		// falls back to a retry plus the sign-in options.
		status.value = 'error';
		return;
	} finally {
		clearTimeout(timeoutId);
	}

	// A user arriving here is redirected by the watcher or the mount check.
	if (user.value) return;

	status.value = 'signed-out';
}

onMounted(() => {
	if (user.value) {
		redirectToDashboard();
		return;
	}

	void checkSession();
});
</script>

<style scoped>
.sign-in-panel {
	animation: sign-in-fade-in 160ms ease-out both;
}

@keyframes sign-in-fade-in {
	from {
		opacity: 0;
	}

	to {
		opacity: 1;
	}
}

@media (prefers-reduced-motion: reduce) {
	.sign-in-panel {
		animation: none;
	}
}
</style>
