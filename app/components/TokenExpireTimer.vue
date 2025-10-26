<template>
	<ClientOnly>
		<span
			v-if="expiresIn > 0"
			class="ml-auto"
		>
			Token expires in {{ expiresIn }} minutes
		</span>
		<template v-else>
			<span class="ml-auto"> Token expired </span>
			<UButton
				icon="i-lucide-rotate-ccw-key"
				external
				to="/api/auth/google"
			/>
		</template>
		<template #fallback>
			<span class="ml-auto"> Token expires in - minutes </span>
		</template>
	</ClientOnly>
</template>

<script setup lang="ts">
const expiresIn = useState('tokenExpiresIn', () => 0);

const { user: userSession } = useUserSession();

function calcExpiresIn(expiresAt: number) {
	return Math.floor((expiresAt - Date.now()) / 1000 / 60);
}

onNuxtReady(() => {
	if (userSession.value) {
		expiresIn.value = calcExpiresIn(userSession.value.tokens.expires_at);
	}
	setInterval(() => {
		if (userSession.value) {
			expiresIn.value = calcExpiresIn(
				userSession.value.tokens.expires_at,
			);
		}
	}, 10000);
});
</script>
