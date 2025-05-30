<template>
	<div>
		<h1 class="text-4xl">Point of Sale</h1>
		<div class="container py-10 mx-auto flex flex-col lg:flex-row">
			<div
				v-if="parsedAllProducts.success"
				class="grid grid-cols-2 gap-4 p-4 lg:max-w-1/2 lg:w-1/2"
			>
				<UButton
					v-for="product in parsedAllProducts.data"
					:key="product.id"
					variant="ghost"
					:disabled="product.amount <= 0"
				>
					<UCard
						class="overflow-hidden max-h-full max-w-full w-full h-full"
						:variant="product.amount > 0 ? 'soft' : 'outline'"
					>
						<template #header>
							<h2 class="text-2xl">
								{{ product.productname }}
							</h2>
						</template>
						<p>{{ product.price }} €</p>
						<p>{{ product.supplier }}</p>
						<p>{{ product.amount }}</p>
					</UCard>
				</UButton>
			</div>
			<div class="flex-1 lg:max-w-1/2 lg:w-1/2">
				<ul>
					<li>pp</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { productArraySchema } from '~/components/DataTable/types';

const { data: allProducts } = await useFetch('/api/products', {
	key: 'productFetching',
	lazy: true,
});
const parsedAllProducts = computed(() =>
	productArraySchema.safeParse(allProducts.value),
);
</script>
