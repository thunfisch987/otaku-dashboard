<template>
	<div class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
		<div>
			<h1 class="text-3xl font-semibold">Point of Sale</h1>
			<p class="mt-2 text-gray-500">
				Add products to the cart, review the order, then complete
				checkout.
			</p>
		</div>

		<div
			v-if="checkoutError"
			role="alert"
			class="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800"
		>
			{{ checkoutError }}
		</div>
		<div
			v-if="checkoutSuccess"
			role="status"
			class="rounded-lg border border-green-300 bg-green-50 p-4 text-green-800"
		>
			{{ checkoutSuccess }}
		</div>

		<div
			class="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]"
		>
			<section
				aria-labelledby="products-heading"
				class="space-y-4"
			>
				<h2
					id="products-heading"
					class="text-xl font-semibold"
				>
					Products
				</h2>
				<div
					v-if="convexAuthLoading || productsPending"
					class="py-8 text-center"
				>
					Loading products…
				</div>
				<div
					v-else-if="productsError"
					role="alert"
					class="rounded-lg border p-4"
				>
					Products could not be loaded. Please refresh and try again.
				</div>
				<div
					v-else-if="availableProducts.length === 0"
					class="rounded-lg border p-4"
				>
					No products are available.
				</div>
				<div
					v-else
					class="grid grid-cols-2 gap-3 sm:grid-cols-3"
				>
					<UButton
						v-for="product in availableProducts"
						:key="product._id"
						variant="outline"
						color="neutral"
						class="min-h-32 justify-start whitespace-normal p-0 text-left"
						:disabled="
							product.amount <= (cart[product._id] ?? 0) ||
							isCheckingOut
						"
						@click="addToCart(product._id as Id<'products'>)"
					>
						<div class="w-full p-4">
							<span class="block text-base font-semibold">{{
								product.productname
							}}</span>
							<span class="mt-1 block">{{
								formatCurrency(product.price)
							}}</span>
							<span class="mt-1 block text-sm text-gray-500">
								{{ product.amount - (cart[product._id] ?? 0) }}
								in stock
							</span>
						</div>
					</UButton>
				</div>
				<div
					v-if="convexAuthenticated && !productsDone"
					class="flex justify-center"
				>
					<UButton
						:loading="loadingMoreProducts"
						:disabled="loadingMoreProducts"
						@click="loadMoreProducts"
					>
						Load more products
					</UButton>
				</div>
			</section>

			<section
				aria-labelledby="cart-heading"
				class="h-fit rounded-xl border p-4 sm:p-5"
			>
				<div class="flex items-center justify-between gap-3">
					<h2
						id="cart-heading"
						class="text-xl font-semibold"
					>
						Review cart
					</h2>
					<UButton
						variant="ghost"
						color="neutral"
						:disabled="cartItems.length === 0 || isCheckingOut"
						@click="clearCart"
					>
						Clear cart
					</UButton>
				</div>

				<div
					v-if="cartItems.length === 0"
					class="py-8 text-center text-gray-500"
				>
					No products selected yet.
				</div>
				<ul
					v-else
					class="mt-4 divide-y"
				>
					<li
						v-for="item in cartItems"
						:key="item.product._id"
						class="flex items-center justify-between gap-3 py-4"
					>
						<div class="min-w-0">
							<p class="font-medium">
								{{ item.product.productname }}
							</p>
							<p class="text-sm text-gray-500">
								{{ formatCurrency(item.product.price) }} each ·
								{{
									formatCurrency(
										item.product.price * item.quantity,
									)
								}}
							</p>
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<UButton
								aria-label="Remove one"
								variant="outline"
								color="neutral"
								class="h-11 w-11 justify-center text-lg"
								:disabled="isCheckingOut"
								@click="
									removeFromCart(
										item.product._id as Id<'products'>,
									)
								"
							>
								−
							</UButton>
							<span class="min-w-6 text-center font-medium">{{
								item.quantity
							}}</span>
							<UButton
								aria-label="Add one"
								variant="outline"
								color="neutral"
								class="h-11 w-11 justify-center text-lg"
								:disabled="
									isCheckingOut ||
									item.quantity >= item.product.amount
								"
								@click="
									addToCart(
										item.product._id as Id<'products'>,
									)
								"
							>
								+
							</UButton>
						</div>
					</li>
				</ul>

				<div
					class="mt-4 flex items-center justify-between border-t pt-4 text-lg font-semibold"
				>
					<span>Total</span>
					<span>{{ formatCurrency(cartTotal) }}</span>
				</div>
				<UButton
					class="mt-4 min-h-12 w-full justify-center text-base"
					:loading="isCheckingOut"
					:disabled="
						cartItems.length === 0 ||
						isCheckingOut ||
						!convexAuthenticated
					"
					@click="completeCheckout"
				>
					Complete checkout
				</UButton>
			</section>
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
	data: products,
	isPending: productsPending,
	isDone: productsDone,
	isLoadingMore: loadingMoreProducts,
	loadMore: loadMoreProducts,
	error: productsError,
} = useConvexPaginatedQuery(api.products.list, productsQueryArgs, {
	numItems: 200,
});

const availableProducts = computed(() => {
	const parsed = productArraySchema.safeParse(products.value);
	return parsed.success ? parsed.data : [];
});
const cart = reactive<Record<string, number>>({});
const cartItems = computed(() =>
	availableProducts.value.flatMap((product) => {
		const quantity = cart[product._id] ?? 0;
		return quantity > 0 ? [{ product, quantity }] : [];
	}),
);
const cartTotal = computed(() =>
	cartItems.value.reduce(
		(total, item) => total + item.product.price * item.quantity,
		0,
	),
);
const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(
		amount,
	);

function addToCart(id: Id<'products'>) {
	const product = availableProducts.value.find((item) => item._id === id);
	if (!product || (cart[id] ?? 0) >= product.amount) return;
	cart[id] = (cart[id] ?? 0) + 1;
	checkoutError.value = '';
	checkoutSuccess.value = '';
}

function removeFromCart(id: Id<'products'>) {
	const quantity = cart[id] ?? 0;
	if (quantity <= 1) delete cart[id];
	else cart[id] = quantity - 1;
	checkoutError.value = '';
	checkoutSuccess.value = '';
}

function clearCart() {
	for (const id of Object.keys(cart)) delete cart[id];
	checkoutError.value = '';
	checkoutSuccess.value = '';
}

const { mutate: checkout } = useConvexMutation(api.transactions.checkout);
const isCheckingOut = ref(false);
const checkoutError = ref('');
const checkoutSuccess = ref('');
const checkoutId = ref('');

async function completeCheckout() {
	if (isCheckingOut.value || cartItems.value.length === 0) return;
	isCheckingOut.value = true;
	checkoutError.value = '';
	checkoutSuccess.value = '';
	try {
		if (!checkoutId.value) checkoutId.value = crypto.randomUUID();
		const result = await checkout({
			checkoutId: checkoutId.value,
			items: cartItems.value.map(({ product, quantity }) => ({
				productId: product._id as Id<'products'>,
				quantity,
			})),
		});
		clearCart();
		checkoutSuccess.value = `Checkout complete. Sale total: ${formatCurrency(result.total)}${result.duplicate ? ' (already recorded)' : ''}.`;
		checkoutId.value = '';
	} catch (error) {
		checkoutError.value =
			error instanceof Error
				? error.message
				: 'Checkout failed. Please review the cart and try again.';
	} finally {
		isCheckingOut.value = false;
	}
}
</script>
