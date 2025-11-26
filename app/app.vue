<template>
	<div class="h-screen flex flex-col">
		<NuxtRouteAnnouncer />
		<NuxtPwaManifest />
		<UApp>
			<NuxtLoadingIndicator color="#E11D48" />
			<OtakuNav />
			<USeparator />
			<main><NuxtPage /></main>
			<USeparator class="mt-auto" />
			<OtakuFooter />
		</UApp>
	</div>
</template>

<script setup lang="ts">
defineShortcuts({
	meta_1: () => {
		navigateTo('/dash/dashboard');
	},
	meta_2: () => {
		navigateTo('/dash/forms');
	},
	meta_3: () => {
		navigateTo('/dash/inventory');
	},
	meta_4: () => {
		navigateTo('/dash/pointofsale');
	},
	meta_5: () => {
		navigateTo('/dash/transactions');
	},
});
</script>
