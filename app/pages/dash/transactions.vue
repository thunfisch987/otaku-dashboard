<template>
	<div class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
		<div
			class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
		>
			<div>
				<h1 class="text-3xl font-semibold">Sales records</h1>
				<p class="mt-2 text-gray-500">
					Review completed sales and download a daily reconciliation
					CSV.
				</p>
			</div>
			<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
				<label
					class="flex flex-col gap-1 font-medium"
					for="sales-day"
				>
					Select day
					<input
						id="sales-day"
						v-model="selectedDay"
						type="date"
						class="min-h-12 rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900"
					/>
				</label>
				<UButton
					class="min-h-12 justify-center"
					:disabled="isLoading || !isDone || saleRows.length === 0"
					@click="downloadCsv"
				>
					Download CSV
				</UButton>
			</div>
		</div>

		<div
			v-if="salesError"
			role="alert"
			class="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800"
		>
			Sales records could not be loaded. Please try again.
		</div>
		<div
			v-else-if="isLoading"
			class="rounded-lg border p-6 text-center"
		>
			Loading sales records…
		</div>
		<div
			v-else-if="saleRows.length === 0 && isDone"
			class="rounded-lg border p-6 text-center text-gray-500"
		>
			No sales recorded for {{ selectedDay }}.
		</div>
		<div
			v-if="!salesError && !isLoading && !isDone"
			class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
			role="status"
		>
			<p>
				{{ sales.length }} sales loaded. Load all records before
				downloading.
			</p>
			<UButton
				class="min-h-11"
				:loading="isLoadingMore"
				:disabled="isLoadingMore"
				@click="loadMore(100)"
			>
				Load more sales
			</UButton>
		</div>
		<div
			v-else-if="saleRows.length > 0"
			class="space-y-4"
		>
			<div class="flex flex-wrap gap-x-8 gap-y-2 rounded-lg border p-4">
				<p>
					<span class="font-medium">Sales:</span>
					{{ salesData?.length ?? 0 }}
				</p>
				<p>
					<span class="font-medium">Items sold:</span>
					{{ totalQuantity }}
				</p>
				<p>
					<span class="font-medium">Total:</span>
					{{ formatCurrency(totalSales) }}
				</p>
			</div>
			<UTable
				:data="saleRows"
				class="flex-1"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { api } from '#convex/api';

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

const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useAppConvexAuth();
const selectedDay = ref(formatDateInput(new Date()));
const dayRange = computed(() => {
	const [year, month, day] = selectedDay.value.split('-').map(Number);
	const start = new Date(year, month - 1, day);
	const end = new Date(year, month - 1, day + 1);
	if (!selectedDay.value || !Number.isFinite(start.getTime())) return null;
	return { dayStart: start.getTime(), dayEnd: end.getTime() };
});
const salesQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value || !dayRange.value
		? 'skip'
		: dayRange.value,
);
const {
	data: salesData,
	isPending: salesPending,
	error: salesError,
	isDone,
	isLoadingMore,
	loadMore,
} = useConvexPaginatedQuery(api.transactions.listSalesForDay, salesQueryArgs, {
	numItems: 100,
});
const isLoading = computed(() => convexAuthLoading.value || salesPending.value);
const sales = computed(() => (salesData.value ?? []) as SaleWithItems[]);
const saleRows = computed(() =>
	sales.value.flatMap((sale) =>
		sale.items.map((item, itemIndex) => ({
			Time: new Date(sale.timestamp).toLocaleTimeString('en', {
				hour: '2-digit',
				minute: '2-digit',
			}),
			'Sale ID': sale._id,
			Operator: sale.operatorName,
			Product: item.productName,
			Quantity: item.quantity,
			'Unit price': formatCurrency(item.unitPrice),
			'Line total': formatCurrency(item.lineTotal),
			'Sale total': itemIndex === 0 ? formatCurrency(sale.total) : '',
		})),
	),
);
const totalQuantity = computed(() =>
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
const totalSales = computed(() =>
	sales.value.reduce((total, sale) => total + sale.total, 0),
);
const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(
		amount,
	);

function formatDateInput(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function csvCell(value: string | number) {
	let text = String(value);
	if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
	return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv() {
	const headers = [
		'Time',
		'Sale ID',
		'Operator',
		'Product',
		'Quantity',
		'Unit price',
		'Line total',
		'Sale total',
	];
	const body = saleRows.value.map((row) =>
		headers
			.map((header) => csvCell(row[header as keyof typeof row]))
			.join(','),
	);
	const csv = [headers.map(csvCell).join(','), ...body].join('\r\n');
	const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = `sales-${selectedDay.value}.csv`;
	anchor.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>
