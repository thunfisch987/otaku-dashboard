<template>
	<div>
		<h1 class="text-4xl">Point of Sale</h1>
		<div class="container py-10 mx-auto flex flex-col lg:flex-row">
			<div
				v-if="parsedAllProducts"
				class="grid grid-cols-2 gap-4 p-4 lg:max-w-1/2 lg:w-1/2"
			>
				<UButton
					v-for="product in parsedAllProducts.data"
					:key="product._id"
					variant="ghost"
					:disabled="product.amount <= 0"
					@click="decreaseAmount(product._id as Id<'products'>)"
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
			<div
				v-if="convexAuthenticated && !productsDone"
				class="flex justify-center py-4 lg:max-w-1/2 lg:w-1/2"
			>
				<UButton
					:loading="loadingMoreProducts"
					:disabled="loadingMoreProducts"
					@click="loadMoreProducts"
				>
					Load more products
				</UButton>
			</div>
			<!-- <div class="flex-1 lg:max-w-1/2 lg:w-1/2">
				<ul>
					<li>pp</li>
				</ul>
			</div> -->
		</div>
	</div>
</template>

<script setup lang="ts">
import { api } from '#convex/api';
import { productArraySchema } from '~/components/Inventory/types';
import type { Id } from '~~/convex/_generated/dataModel';
const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useAppConvexAuth();
const productsQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);
const {
	data: productos,
	isPending: pendingos,
	isDone: productsDone,
	isLoadingMore: loadingMoreProducts,
	loadMore: loadMoreProducts,
	error: erroros,
	suspense: suspensos,
} = useConvexPaginatedQuery(api.products.list, productsQueryArgs, {
	numItems: 200,
});

await suspensos();

const parsedAllProducts = computed(() =>
	productArraySchema.safeParse(productos.value),
);

function decreaseAmount(id: Id<'products'>) {
	mutateDecreaseAmount({
		id: id,
	});
}

const { mutate: mutateDecreaseAmount } = useConvexMutation(
	api.products.decreaseAmount,
);
</script>
