<template>
	<div class="flex flex-wrap">
		<div
			v-if="parsedAllProducts.data"
			class="flex-auto container py-10 mx-auto"
		>
			<Card>
				<CardHeader>
					<CardTitle>Products</CardTitle>
				</CardHeader>
				<CardContent>
					<ProductsDataTable
						:columns="columns"
						:data="parsedAllProducts.data"
						toolbar
						selection
					/>
				</CardContent>
			</Card>
		</div>
	</div>
</template>

<script setup lang="ts">
import { productArraySchema, columns } from '~/components/DataTable/columns';

const { data: allProducts } = await useFetch('/api/products', {
	key: 'productFetching',
	lazy: true,
});

const parsedAllProducts = computed(() => productArraySchema.safeParse(allProducts.value));
</script>
