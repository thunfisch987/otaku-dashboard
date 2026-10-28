<template>
	<div class="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
		<h1 class="text-3xl font-semibold">Inventory</h1>
		<InventoryOnigiriPricing />
		<UCard>
			<template #header>Products</template>
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
