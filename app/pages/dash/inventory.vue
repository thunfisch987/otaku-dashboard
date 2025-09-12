<template>
	<div class="container py-10 mx-auto">
		<UCard>
			<template #header> Produkte </template>
			<DataTable />
		</UCard>
	</div>
</template>

<script setup lang="ts">
const createProductOpen = useState('createProductOpen', () => false);
defineShortcuts({
	c: () => {
		document.getElementById('createProductButton')?.click();
	},
});
</script>
