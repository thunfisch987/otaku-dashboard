<template>
	<div class="p-4 pb-0">
		<main id="maingrid">
			<div id="dash">
				<h1 class="text-xl">Dashboard</h1>
			</div>
			<UCard id="form">
				<template #header> Forms </template>
				<div />
			</UCard>
			<UCard id="posa">
				<template #header> Point of Sale stuff </template>
				<div />
			</UCard>
			<UCard id="inve">
				<template #header> Inventory </template>
				<div />
			</UCard>
		</main>
		<UButton
			to="pointofsale"
			icon="i-lucide-arrow-big-right-dash"
			trailing
			variant="subtle"
			size="xl"
			class="mt-2"
		>
			Go to POS
		</UButton>
	</div>
</template>

<style>
#maingrid {
	display: grid;
	gap: 1rem;
	margin-bottom: 0.5rem;
	grid-template-areas:
		'dash dash form form form'
		'posa posa posa inve inve'
		'posa posa posa inve inve';
}

#form {
	grid-area: form;
}

#posa {
	grid-area: posa;
}

#inve {
	grid-area: inve;
}
</style>
