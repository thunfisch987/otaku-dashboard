<template>
	<div class="flex flex-wrap">
		<div
			v-if="parsedAllProducts.data"
			class="flex-auto container py-10 mx-auto"
		>
			<ProductsDataTable
				:columns="columns"
				:data="parsedAllProducts.data"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { productArraySchema, columns } from '~/components/products/columns';

const { data: allProducts } = await useFetch('/api/products', {
	key: 'productFetching',
	lazy: true,
});

const parsedAllProducts = computed(() => productArraySchema.safeParse(allProducts.value));
</script>
