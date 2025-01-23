<template>
	<main id="maingrid">
		<div id="dash">
			<h1 class="text-xl">
				Dashboard
			</h1>
		</div>
		<Card id="form">
			<CardHeader>
				<CardTitle> Forms </CardTitle>
			</CardHeader>
			<CardContent />
		</Card>
		<Card id="posa">
			<CardHeader>
				<CardTitle> Point of Sale stuff </CardTitle>
			</CardHeader>
			<CardContent />
		</Card>
		<Card id="inve">
			<CardHeader>
				<CardTitle>Inventory </CardTitle>
			</CardHeader>
			<!-- <Separator /> -->
			<CardContent>
				<!-- <ProductsDataTable
					v-if="parsedAllProducts.data"
					:columns="columns"
					:data="parsedAllProducts.data"
				/>
				<span v-else>
					yeet: {{ parsedAllProducts.data }}
				</span> -->
			</CardContent>
		</Card>
	</main>
</template>

<script setup lang="ts">
import { productArraySchema, columns } from '~/components/products/columns';

const { data: allProducts } = await useFetch('/api/products', {
	key: 'productFetching',
	lazy: true,
});

const parsedAllProducts = computed(() => productArraySchema.safeParse(allProducts.value));
</script>

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
