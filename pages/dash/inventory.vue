<template>
	<div class="flex  flex-wrap">
		<Card class="flex-1">
			<CardHeader>
				<CardTitle>Create Product</CardTitle>
			</CardHeader>
			<CardContent>
				<AutoForm
					:schema="insertProductSchema"
					@submit="(data) => submit(data)"
				>
					<Button type="submit">
						Create Product
					</Button>
				</AutoForm>
			</CardContent>
		</Card>
		<pre class="flex-1">{{ allProducts }}</pre>
		<div
			v-if="parsedAllProducts.data"
			class="container py-10 mx-auto"
		>
			<ProductsDataTable
				:columns="columns"
				:data="parsedAllProducts.data"
			/>
		</div>
		<pre>{{ parsedAllProducts.data }}</pre>
	</div>
</template>

<script setup lang="ts">
import type { z } from 'zod';
import { insertProductSchema, productArraySchema, columns } from '~/components/products/columns';

const { data: allProducts, refresh: refreshProducts } = await useFetch('/api/products');

const parsedAllProducts = productArraySchema.safeParse(allProducts.value);

async function submit(formData: z.infer<typeof insertProductSchema>) {
	const { data: newProduct } = await useFetch('/api/products', {
		method: 'post',
		body: formData,
	});
	refreshProducts();
	return { newProduct };
}
</script>
