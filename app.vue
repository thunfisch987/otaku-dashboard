<template>
	<NuxtPwaAssets />
	<div>
		<OtakuNav />
		<Separator />
		<NuxtPage />
		<!-- Footer ??? -->
	</div>
</template>

<script setup lang="ts">
const { $pwa } = useNuxtApp();
</script>
