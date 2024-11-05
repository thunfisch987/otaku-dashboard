<template>
	<main id="maingrid">
		<div id="dash">
			<h1 class="text-xl">
				Dashboard
			</h1>
		</div>
		<div
			id="form"
			class="p-1"
		>
			<Card>
				<CardHeader>
					<CardTitle>
						Forms
					</CardTitle>
				</CardHeader>
				<CardContent />
			</Card>
		</div>
		<div
			id="posa"
			class="p-1"
		>
			<Card>
				<CardHeader>
					<CardTitle>
						Point of Sale stuff
					</CardTitle>
				</CardHeader>
				<CardContent />
			</Card>
		</div>
		<div
			id="inve"
			class="p-1"
		>
			<Card>
				<CardHeader>
					<CardTitle>
						Inventory
					</CardTitle>
				</CardHeader>
				<CardContent />
			</Card>
		</div>
	</main>
</template>

<style>
div {
    border: 1px dotted red;
}

#maingrid {
    display: grid;
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
