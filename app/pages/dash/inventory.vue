<template>
	<div class="container py-10 mx-auto">
		<UCard>
			<template #header> Produkte </template>
			<InventoryTable />
		</UCard>
	</div>
</template>

<script setup lang="ts">
defineShortcuts({
	c: () => {
		document.getElementById('createProductButton')?.click();
	},
});
</script>
