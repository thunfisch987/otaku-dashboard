<template>
	<main class="mx-auto w-full max-w-7xl space-y-6 p-4 pb-8 sm:p-6 lg:p-8">
		<header
			class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
		>
			<div>
				<p class="text-sm font-medium text-muted">Event operations</p>
				<h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
			</div>
			<UButton
				to="pointofsale"
				size="lg"
				icon="i-lucide-shopping-cart"
				class="min-h-12 justify-center sm:self-auto"
			>
				Open point of sale
			</UButton>
		</header>

		<section
			aria-labelledby="shortcuts-heading"
			class="space-y-3"
		>
			<h2
				id="shortcuts-heading"
				class="text-lg font-semibold"
			>
				Quick access
			</h2>
			<div
				class="rounded-xl border border-default bg-elevated p-4"
				aria-label="Keyboard navigation shortcuts"
			>
				<div class="flex flex-wrap items-center gap-x-2 gap-y-3">
					<p class="mr-2 text-sm text-muted">
						Use your keyboard to jump to a page: press
						<kbd
							class="rounded border border-default bg-default px-1.5 py-0.5 font-mono text-xs font-semibold text-highlighted"
							>G</kbd
						>, then:
					</p>
					<span
						v-for="shortcut in [
							{ key: 'D', page: 'Dashboard' },
							{ key: 'F', page: 'Forms' },
							{ key: 'I', page: 'Inventory' },
							{ key: 'P', page: 'Point of sale' },
							{ key: 'T', page: 'Transactions' },
							{ key: 'U', page: 'Users' },
						]"
						:key="shortcut.key"
						class="inline-flex items-center gap-1.5 text-sm"
					>
						<kbd
							class="rounded border border-default bg-default px-1.5 py-0.5 font-mono text-xs font-semibold text-highlighted"
							>{{ shortcut.key }}</kbd
						>
						<span class="text-muted">{{ shortcut.page }}</span>
					</span>
				</div>
			</div>
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				<UCard class="h-full">
					<div class="flex h-full flex-col gap-4">
						<div class="flex items-start gap-3">
							<span
								class="rounded-lg bg-primary/10 p-3 text-primary"
								><UIcon
									name="i-lucide-shopping-cart"
									class="size-6"
							/></span>
							<div>
								<h3 class="font-semibold">Point of sale</h3>
								<p class="text-sm text-muted">
									Open the sales screen to serve customers.
								</p>
							</div>
						</div>
						<UButton
							to="pointofsale"
							variant="soft"
							size="lg"
							class="mt-auto min-h-12 justify-center"
							>Go to point of sale</UButton
						>
					</div>
				</UCard>
				<UCard class="h-full">
					<div class="flex h-full flex-col gap-4">
						<div class="flex items-start gap-3">
							<span
								class="rounded-lg bg-primary/10 p-3 text-primary"
								><UIcon
									name="i-lucide-boxes"
									class="size-6"
							/></span>
							<div>
								<h3 class="font-semibold">Inventory</h3>
								<p class="text-sm text-muted">
									Search products, check stock, and update
									quantities.
								</p>
							</div>
						</div>
						<UButton
							to="inventory"
							variant="soft"
							size="lg"
							class="mt-auto min-h-12 justify-center"
							>Manage inventory</UButton
						>
					</div>
				</UCard>
				<UCard class="h-full">
					<div class="flex h-full flex-col gap-4">
						<div class="flex items-start gap-3">
							<span
								class="rounded-lg bg-primary/10 p-3 text-primary"
								><UIcon
									name="i-lucide-clipboard-list"
									class="size-6"
							/></span>
							<div>
								<h3 class="font-semibold">Forms</h3>
								<p class="text-sm text-muted">
									Open the event form prototype. Submissions
									are not saved yet.
								</p>
							</div>
						</div>
						<UButton
							to="forms"
							variant="soft"
							size="lg"
							class="mt-auto min-h-12 justify-center"
							>Open forms</UButton
						>
					</div>
				</UCard>
			</div>
		</section>

		<section
			aria-labelledby="sales-summary-heading"
			class="space-y-3"
		>
			<div
				class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
			>
				<div>
					<h2
						id="sales-summary-heading"
						class="text-lg font-semibold"
					>
						Today's sales
					</h2>
					<p class="text-sm text-muted">
						Revenue, checkout count, and the latest completions.
					</p>
				</div>
				<UButton
					to="transactions"
					variant="outline"
					icon="i-lucide-arrow-right"
					trailing
					class="min-h-11"
					>View transactions</UButton
				>
			</div>

			<div
				v-if="convexAuthLoading"
				class="rounded-xl border border-default p-6 text-muted"
				role="status"
			>
				<UProgress animation="carousel" />
				<p class="mt-3">Checking your connection…</p>
			</div>
			<UAlert
				v-else-if="!convexAuthenticated"
				title="You are not connected to sales records"
				description="Sign in again to load today's sales figures."
				color="error"
				icon="i-lucide-circle-alert"
			/>
			<UAlert
				v-else-if="salesError"
				title="Sales could not be loaded"
				description="Open transactions to try again or check your connection."
				color="error"
				icon="i-lucide-circle-alert"
			/>
			<div
				v-else-if="pendingSales"
				class="grid gap-3 sm:grid-cols-3"
				aria-label="Loading sales summary"
				role="status"
			>
				<div
					v-for="item in 3"
					:key="item"
					class="h-28 animate-pulse rounded-xl border border-default bg-elevated"
				/>
			</div>
			<template v-else>
				<div class="grid gap-3 sm:grid-cols-3">
					<UCard>
						<p class="text-sm font-medium text-muted">
							Revenue today
						</p>
						<p class="mt-2 text-3xl font-semibold tabular-nums">
							<span v-text="formattedSalesTotal" /><span
								v-if="!salesDone"
								class="text-lg text-muted"
								>+</span
							>
						</p>
					</UCard>
					<UCard>
						<p class="text-sm font-medium text-muted">
							Completed sales
						</p>
						<p class="mt-2 text-3xl font-semibold tabular-nums">
							<span v-text="salesCount" /><span
								v-if="!salesDone"
								class="text-lg text-muted"
								>+</span
							>
						</p>
					</UCard>
					<UCard>
						<p class="text-sm font-medium text-muted">Items sold</p>
						<p class="mt-2 text-3xl font-semibold tabular-nums">
							<span v-text="formattedItemsSold" /><span
								v-if="!salesDone"
								class="text-lg text-muted"
								>+</span
							>
						</p>
					</UCard>
				</div>

				<div
					v-if="recentSaleRows.length > 0"
					class="space-y-2"
				>
					<h3 class="font-semibold">Recent sales</h3>
					<div
						class="max-w-full overflow-x-auto rounded-xl border border-default"
					>
						<UTable
							:data="recentSaleRows"
							:columns="recentSaleColumns"
							class="min-w-[32rem]"
						/>
					</div>
				</div>
				<div
					v-else-if="salesCount === 0 && salesDone"
					class="rounded-xl border border-dashed border-default p-6 text-center"
				>
					<UIcon
						name="i-lucide-receipt-text"
						class="mx-auto size-8 text-muted"
					/>
					<p class="mt-2 font-medium">No sales yet today</p>
					<p class="mt-1 text-sm text-muted">
						Completed checkouts from point of sale appear here.
					</p>
					<UButton
						to="pointofsale"
						class="mt-4 min-h-11"
						>Open point of sale</UButton
					>
				</div>
				<p
					v-if="!salesDone"
					class="text-sm text-muted"
					role="status"
				>
					Totals show the sales loaded so far. Open transactions to
					see the full list.
				</p>
			</template>
		</section>

		<section
			aria-labelledby="inventory-summary-heading"
			class="space-y-3"
		>
			<div
				class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
			>
				<div>
					<h2
						id="inventory-summary-heading"
						class="text-lg font-semibold"
					>
						Inventory snapshot
					</h2>
					<p class="text-sm text-muted">
						Product and stock counts from the inventory list.
					</p>
				</div>
				<UButton
					to="inventory"
					variant="outline"
					icon="i-lucide-arrow-right"
					trailing
					class="min-h-11"
					>View inventory</UButton
				>
			</div>

			<div
				v-if="convexAuthLoading"
				class="rounded-xl border border-default p-6 text-muted"
				role="status"
			>
				<UProgress animation="carousel" />
				<p class="mt-3">Checking your connection…</p>
			</div>
			<UAlert
				v-else-if="!convexAuthenticated"
				title="You are not connected to inventory data"
				description="Sign in again to load current product and stock counts."
				color="error"
				icon="i-lucide-circle-alert"
			/>
			<UAlert
				v-else-if="productsError"
				title="Inventory could not be loaded"
				description="Open inventory to try again or check your connection."
				color="error"
				icon="i-lucide-circle-alert"
			/>
			<div
				v-else-if="pendingProducts"
				class="grid gap-3 sm:grid-cols-3"
				aria-label="Loading inventory summary"
				role="status"
			>
				<div
					v-for="item in 3"
					:key="item"
					class="h-28 animate-pulse rounded-xl border border-default bg-elevated"
				/>
			</div>
			<UAlert
				v-else-if="!parsedProducts.success"
				title="Inventory data could not be read"
				description="Open inventory to review the product list."
				color="error"
				icon="i-lucide-circle-alert"
			/>
			<template v-else>
				<div class="grid gap-3 sm:grid-cols-3">
					<UCard>
						<p class="text-sm font-medium text-muted">
							Products loaded
						</p>
						<p class="mt-2 text-3xl font-semibold tabular-nums">
							<span v-text="productCount" /><span
								v-if="!productsDone"
								class="text-lg text-muted"
								>+</span
							>
						</p>
					</UCard>
					<UCard>
						<p class="text-sm font-medium text-muted">
							Units in loaded products
						</p>
						<p class="mt-2 text-3xl font-semibold tabular-nums">
							<span v-text="formattedTotalUnits" /><span
								v-if="!productsDone"
								class="text-lg text-muted"
								>+</span
							>
						</p>
					</UCard>
					<UCard>
						<p class="text-sm font-medium text-muted">
							Out of stock
						</p>
						<p class="mt-2 text-3xl font-semibold tabular-nums">
							<span v-text="outOfStockCount" /><span
								v-if="!productsDone"
								class="text-lg text-muted"
								>+</span
							>
						</p>
					</UCard>
				</div>
				<div
					v-if="productCount === 0 && productsDone"
					class="rounded-xl border border-dashed border-default p-6 text-center"
				>
					<UIcon
						name="i-lucide-package-open"
						class="mx-auto size-8 text-muted"
					/>
					<p class="mt-2 font-medium">No products yet</p>
					<p class="mt-1 text-sm text-muted">
						Create products in inventory to see stock totals here.
					</p>
					<UButton
						to="inventory"
						class="mt-4 min-h-11"
						>Open inventory</UButton
					>
				</div>
				<p
					v-else-if="!productsDone"
					class="text-sm text-muted"
					role="status"
				>
					Counts show the products loaded so far. More products are
					available in inventory.
				</p>
			</template>
		</section>
	</main>
</template>

<script setup lang="ts">
import { api } from '#convex/api';
import type { TableColumn } from '@nuxt/ui';
import { productArraySchema } from '~/components/Inventory/types';

const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useAppConvexAuth();
const productsQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);
const {
	data: products,
	isPending: pendingProducts,
	error: productsError,
	isDone: productsDone,
} = useConvexPaginatedQuery(api.products.list, productsQueryArgs, {
	numItems: 200,
});

const parsedProducts = computed(() =>
	productArraySchema.safeParse(products.value),
);
const productCount = computed(() =>
	parsedProducts.value.success ? parsedProducts.value.data.length : 0,
);
const totalUnits = computed(() =>
	parsedProducts.value.success
		? parsedProducts.value.data.reduce(
				(sum, product) => sum + product.amount,
				0,
			)
		: 0,
);
const formattedTotalUnits = computed(() =>
	totalUnits.value.toLocaleString('en-US'),
);
const outOfStockCount = computed(() =>
	parsedProducts.value.success
		? parsedProducts.value.data.filter((product) => product.amount === 0)
				.length
		: 0,
);

type SaleWithItems = {
	_id: string;
	_creationTime: number;
	timestamp: number;
	operatorName: string;
	total: number;
	items: {
		productName: string;
		unitPrice: number;
		quantity: number;
		lineTotal: number;
	}[];
};

const dayRange = computed(() => {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
	return { dayStart: start.getTime(), dayEnd: end.getTime() };
});
const salesQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value
		? 'skip'
		: dayRange.value,
);
const {
	data: salesData,
	isPending: pendingSales,
	error: salesError,
	isDone: salesDone,
} = useConvexPaginatedQuery(api.transactions.listSalesForDay, salesQueryArgs, {
	numItems: 200,
});
const sales = computed(() => (salesData.value ?? []) as SaleWithItems[]);
const salesCount = computed(() => sales.value.length);
const salesTotal = computed(() =>
	sales.value.reduce((total, sale) => total + sale.total, 0),
);
const formattedSalesTotal = computed(() => formatCurrency(salesTotal.value));
const itemsSoldCount = computed(() =>
	sales.value.reduce(
		(total, sale) =>
			total +
			sale.items.reduce(
				(saleTotal, item) => saleTotal + item.quantity,
				0,
			),
		0,
	),
);
const formattedItemsSold = computed(() =>
	itemsSoldCount.value.toLocaleString('en-US'),
);

type SaleRow = {
	Time: string;
	Operator: string;
	Products: string;
	Total: string;
};

const recentSales = computed(() => sales.value.slice(0, 5));
const recentSaleRows = computed<SaleRow[]>(() =>
	recentSales.value.map((sale) => ({
		Time: new Date(sale.timestamp).toLocaleTimeString('en', {
			hour: '2-digit',
			minute: '2-digit',
		}),
		Operator: sale.operatorName,
		Products: summarizeSaleProducts(sale.items),
		Total: formatCurrency(sale.total),
	})),
);
const recentSaleColumns: TableColumn<SaleRow>[] = [
	{
		accessorKey: 'Time',
		header: 'Time',
	},
	{
		accessorKey: 'Operator',
		header: 'Operator',
	},
	{
		accessorKey: 'Products',
		header: 'Products',
	},
	{
		accessorKey: 'Total',
		header: 'Total',
	},
];

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(
		amount,
	);

function summarizeSaleProducts(items: SaleWithItems['items']) {
	const shown = items
		.slice(0, 3)
		.map((item) => `${item.productName} × ${item.quantity}`);
	const remaining = items.length - shown.length;
	return remaining > 0
		? `${shown.join(', ')} +${remaining} more`
		: shown.join(', ');
}
</script>
