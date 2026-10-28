<template>
	<div class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
		<div>
			<h1 class="text-3xl font-semibold">Point of Sale</h1>
			<p class="mt-2 text-gray-500">
				Add products to the cart, review the order, then complete
				checkout.
			</p>
			<div class="mt-4">
				<UCheckbox
					v-model="isHelperCheckout"
					:disabled="isCheckingOut"
					label="Helper checkout"
				/>
				<p class="mt-1 text-sm text-gray-500">
					Products use their helper price when set; otherwise the
					regular price applies.
				</p>
			</div>
		</div>

		<UAlert
			v-if="checkoutError"
			:title="checkoutErrorTitle"
			:description="checkoutError"
			color="error"
			icon="i-lucide-circle-alert"
		/>
		<UAlert
			v-else-if="isCheckingOut && !convexConnected"
			title="Connection lost"
			description="The checkout has not been confirmed yet. It will be sent automatically when the connection returns — keep this page open. If the connection does not come back, reloading is safe: rebuilding the same cart and completing checkout again cannot create a duplicate sale."
			color="warning"
			icon="i-lucide-wifi-off"
		/>
		<UAlert
			v-if="unresolvedCheckout"
			title="Earlier checkout unconfirmed"
			description="A checkout attempt was interrupted before its result arrived — it may or may not have been recorded. Rebuilding the exact same cart and completing checkout again resolves it safely; a different cart starts a new sale. Check the sales records to confirm what was recorded."
			color="warning"
			icon="i-lucide-triangle-alert"
		/>
		<UAlert
			v-if="tokenStorageAvailable === false"
			title="Retry protection unavailable"
			description="This browser is not keeping the checkout retry token, so reloading during a checkout could record a sale twice. Avoid reloading until checkout is confirmed."
			color="warning"
			icon="i-lucide-shield-alert"
		/>
		<Transition
			enter-active-class="transition duration-200 ease-out"
			enter-from-class="translate-y-2 opacity-0"
			enter-to-class="translate-y-0 opacity-100"
			leave-active-class="transition duration-150 ease-in"
			leave-from-class="translate-y-0 opacity-100"
			leave-to-class="translate-y-2 opacity-0"
		>
			<UAlert
				v-if="checkoutSuccess"
				:description="checkoutSuccess"
				color="success"
				icon="i-lucide-circle-check"
				role="status"
				class="pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md shadow-lg sm:inset-x-auto sm:right-6"
			/>
		</Transition>

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
				<UAlert
					v-else-if="productsError"
					title="Products could not be loaded"
					description="Please refresh and try again."
					color="error"
					icon="i-lucide-circle-alert"
				/>
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
								formatCurrency(effectivePrice(product))
							}}</span>
							<span
								v-if="
									isHelperCheckout &&
									product.helperPrice === undefined
								"
								class="mt-1 block text-xs text-gray-500"
							>
								Regular price
							</span>
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
								{{
									formatCurrency(effectivePrice(item.product))
								}}
								each ·
								{{
									formatCurrency(
										effectivePrice(item.product) *
											item.quantity,
									)
								}}
							</p>
							<p
								v-if="item.quantity <= item.product.amount"
								class="text-sm text-muted"
							>
								Leaves
								{{ item.product.amount - item.quantity }}
								in stock after checkout
							</p>
							<p
								v-else
								class="text-sm text-warning"
							>
								Not enough stock left for this quantity
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
				<div
					class="mt-4 flex flex-wrap items-center justify-between gap-2"
				>
					<UBadge
						:color="isHelperCheckout ? 'warning' : 'neutral'"
						variant="subtle"
					>
						{{
							isHelperCheckout
								? 'Helper checkout pricing active'
								: 'Regular checkout pricing'
						}}
					</UBadge>
					<UButton
						class="min-h-12 w-full justify-center text-base sm:w-auto"
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
				</div>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { api } from '#convex/api';
import { createRequestId } from '~/utils/requestId';
import { productArraySchema } from '~/components/Inventory/types';
import type { Id } from '~~/convex/_generated/dataModel';

const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useAppConvexAuth();
const connection = useConvexConnectionState();
// Assume connected while the state is unknown: vue-convex defaults its own
// helper to false, which would show a false "Connection lost" warning before
// the client has ever subscribed.
const convexConnected = computed(
	() => connection.state.value?.isWebSocketConnected ?? true,
);
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
const isHelperCheckout = ref(false);
const cartItems = computed(() =>
	availableProducts.value.flatMap((product) => {
		const quantity = cart[product._id] ?? 0;
		return quantity > 0 ? [{ product, quantity }] : [];
	}),
);
const cartTotal = computed(() =>
	cartItems.value.reduce(
		(total, item) => total + effectivePrice(item.product) * item.quantity,
		0,
	),
);
function effectivePrice(product: { price: number; helperPrice?: number }) {
	const price =
		isHelperCheckout.value && product.helperPrice !== undefined
			? product.helperPrice
			: product.price;
	return Math.round(price * 100) / 100;
}
const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(
		amount,
	);

function addToCart(id: Id<'products'>) {
	const product = availableProducts.value.find((item) => item._id === id);
	if (!product || (cart[id] ?? 0) >= product.amount) return;
	cart[id] = (cart[id] ?? 0) + 1;
	checkoutErrorTitle.value = '';
	checkoutError.value = '';
	checkoutSuccess.value = '';
}

function removeFromCart(id: Id<'products'>) {
	const quantity = cart[id] ?? 0;
	if (quantity <= 1) cart[id] = 0;
	else cart[id] = quantity - 1;
	checkoutErrorTitle.value = '';
	checkoutError.value = '';
	checkoutSuccess.value = '';
}

function clearCart() {
	for (const id of Object.keys(cart)) cart[id] = 0;
	isHelperCheckout.value = false;
	checkoutErrorTitle.value = '';
	checkoutError.value = '';
	checkoutSuccess.value = '';
}

const { mutate: checkout } = useConvexMutation(api.transactions.checkout);
const isCheckingOut = ref(false);
const checkoutError = ref('');
const checkoutErrorTitle = ref('');
const checkoutSuccess = ref('');

// A checkout attempt is identified by a token the server keys sales on
// (sales.by_checkoutId). The token lives in sessionStorage together with the
// cart signature it was created for, so that a retry after an interrupted
// checkout — even after a page reload — is recognized by the server as the
// same sale instead of deducting stock twice. A different cart gets a fresh
// token.
const CHECKOUT_TOKEN_STORAGE_KEY = 'pos-checkout-token';

type StoredCheckoutToken = {
	signature: string;
	checkoutId: string;
};

const cartSignature = computed(() =>
	cartItems.value
		.map((item) => `${item.product._id}:${item.quantity}`)
		.sort()
		.join('|'),
);

function readStoredCheckoutToken(): StoredCheckoutToken | null {
	if (!import.meta.client) return null;
	try {
		const raw = sessionStorage.getItem(CHECKOUT_TOKEN_STORAGE_KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return null;
		const { signature, checkoutId } = parsed as Record<string, unknown>;
		if (typeof signature !== 'string' || typeof checkoutId !== 'string') {
			return null;
		}
		return { signature, checkoutId };
	} catch {
		return null;
	}
}

function writeStoredCheckoutToken(token: StoredCheckoutToken): boolean {
	if (!import.meta.client) return false;
	try {
		sessionStorage.setItem(
			CHECKOUT_TOKEN_STORAGE_KEY,
			JSON.stringify(token),
		);
		return true;
	} catch {
		// sessionStorage can be unavailable (e.g. strict privacy settings).
		// Checkout still works; only reload protection for an interrupted
		// checkout is lost — surfaced to the operator via an alert.
		return false;
	}
}

function clearStoredCheckoutToken() {
	if (!import.meta.client) return;
	try {
		sessionStorage.removeItem(CHECKOUT_TOKEN_STORAGE_KEY);
	} catch {
		// Nothing depends on removal succeeding.
	}
}

function describeCheckoutError(error: unknown): {
	title: string;
	message: string;
} {
	// The Convex client rejects a mutation only with a server result; a lost
	// connection keeps the checkout pending (and retried) instead. A server
	// rejection aborts the whole transaction, so nothing was recorded.
	const message = error instanceof Error ? error.message : String(error);
	const reason = /Uncaught Error: ([^\n]+)/.exec(message)?.[1];
	if (reason !== undefined || message.includes('[CONVEX ')) {
		return {
			title: 'Checkout rejected — nothing was recorded',
			message: `${reason ?? 'The server rejected the checkout'}. The cart was not changed.`,
		};
	}
	// Anything else cannot be attributed to the server: do not claim either
	// outcome.
	return {
		title: 'Checkout unconfirmed — the sale may or may not be recorded',
		message:
			'The checkout result did not arrive. Do not change the cart: completing checkout again with the same cart is safe — if the sale was already recorded, it is not duplicated.',
	};
}

// Mirrors the checkout token stored in sessionStorage (which is not reactive)
// so the UI can warn whenever a stored token is no longer covered by the
// current cart — e.g. after a reload with an empty cart, or after the cart
// was changed following an ambiguous failure.
const tokenStorageAvailable = ref<boolean | null>(null);
const storedCheckoutSignature = ref<string | null>(null);

const unresolvedCheckout = computed(
	() =>
		storedCheckoutSignature.value !== null &&
		storedCheckoutSignature.value !== cartSignature.value,
);

onMounted(() => {
	const stored = readStoredCheckoutToken();
	storedCheckoutSignature.value = stored ? stored.signature : null;
});

async function completeCheckout() {
	if (isCheckingOut.value || cartItems.value.length === 0) return;
	isCheckingOut.value = true;
	checkoutErrorTitle.value = '';
	checkoutError.value = '';
	checkoutSuccess.value = '';
	const signature = cartSignature.value;
	const stored = readStoredCheckoutToken();
	const checkoutId =
		stored && stored.signature === signature
			? stored.checkoutId
			: createRequestId();
	// Persist the token before the request so a page reload during the
	// checkout keeps the retry idempotent.
	if (writeStoredCheckoutToken({ signature, checkoutId })) {
		tokenStorageAvailable.value = true;
		storedCheckoutSignature.value = signature;
	} else {
		tokenStorageAvailable.value = false;
		storedCheckoutSignature.value = null;
	}
	try {
		const result = await checkout({
			checkoutId,
			isHelper: isHelperCheckout.value,
			items: cartItems.value.map(({ product, quantity }) => ({
				productId: product._id as Id<'products'>,
				quantity,
			})),
		});
		clearCart();
		clearStoredCheckoutToken();
		storedCheckoutSignature.value = null;
		// Assigned last so nothing cleared above can hide the confirmation.
		checkoutSuccess.value = `Checkout complete. Sale total: ${formatCurrency(result.total)}${result.duplicate ? ' (already recorded)' : ''}.`;
	} catch (error) {
		const { title, message } = describeCheckoutError(error);
		checkoutErrorTitle.value = title;
		checkoutError.value = message;
	} finally {
		isCheckingOut.value = false;
	}
}
</script>
