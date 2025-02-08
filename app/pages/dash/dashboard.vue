<template>
	<main id="maingrid">
		<div id="dash">
			<h1 class="text-xl">
				Dashboard
			</h1>
		</div>
		<UCard id="form">
			<template #header>
				Forms
			</template>
			<div />
		</UCard>
		<UCard id="posa">
			<template #header>
				Point of Sale stuff
			</template> 
			<div />
		</UCard>
		<UCard id="inve">
			<template #header>
				Inventory
			</template>
			<div/>
		</UCard>
	</main>
</template>

<style>
#maingrid {
    display: grid;
    gap: 1rem;
    padding: 1rem;
    grid-template-areas:
        "dash dash form form form"
        "posa posa posa inve inve"
        "posa posa posa inve inve";
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
