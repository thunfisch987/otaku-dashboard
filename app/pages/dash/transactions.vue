<template>
	<div class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
		<div
			class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
		>
			<div>
				<h1 class="text-3xl font-semibold">Sales records</h1>
				<p class="mt-2 text-muted">
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
					<UInput
						id="sales-day"
						v-model="selectedDay"
						type="date"
						class="min-h-12"
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

		<UAlert
			v-if="salesError"
			title="Sales records could not be loaded"
			description="Please try again."
			color="error"
			icon="i-lucide-circle-alert"
		/>
		<div
			v-else-if="isLoading"
			class="rounded-lg border p-6 text-center"
		>
			Loading sales records…
		</div>
		<div
			v-else-if="saleRows.length === 0 && isDone"
			class="rounded-lg border p-6 text-center text-muted"
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
			<div class="max-w-full overflow-x-auto rounded-lg border">
				<UTable
					:data="saleRows"
					:columns="saleColumns"
					class="min-w-[60rem]"
				/>
			</div>
		</div>

		<UModal
			v-model:open="revertOpen"
			title="Revert sale"
			:description="revertDescription"
			:ui="{ footer: 'justify-end' }"
		>
			<template #footer>
				<div class="flex flex-wrap justify-end gap-2">
					<UButton
						color="neutral"
						label="Cancel"
						:disabled="isReverting"
						@click="revertOpen = false"
					/>
					<UButton
						label="Revert sale"
						color="error"
						:loading="isReverting"
						:disabled="isReverting"
						@click="confirmRevert"
					/>
				</div>
				<UAlert
					v-if="revertError"
					title="Could not revert the sale"
					:description="revertErrorMessage"
					class="mt-3"
					color="error"
					icon="i-lucide-circle-alert"
				/>
			</template>
		</UModal>
	</div>
</template>

<script setup lang="ts">
import { api } from '#convex/api';
import { UButton } from '#components';
import type { TableColumn } from '@nuxt/ui';
import { h } from 'vue';
import type { Id } from '~~/convex/_generated/dataModel';

type SaleWithItems = {
	_id: string;
	_creationTime: number;
	timestamp: number;
	operatorName: string;
	total: number;
	isHelper?: boolean;
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
	if (
		!selectedDay.value ||
		year === undefined ||
		month === undefined ||
		day === undefined
	) {
		return null;
	}
	const start = new Date(year, month - 1, day);
	const end = new Date(year, month - 1, day + 1);
	if (!Number.isFinite(start.getTime())) return null;
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
type SaleRow = {
	Time: string;
	'Sale ID': string;
	Operator: string;
	Helper: string;
	Product: string;
	Quantity: number;
	'Unit price': string;
	'Line total': string;
	'Sale total': string;
	_saleId: Id<'sales'>;
	_isFirstRow: boolean;
};

const saleRows = computed<SaleRow[]>(() =>
	sales.value.flatMap((sale) =>
		sale.items.map((item, itemIndex) => ({
			Time: new Date(sale.timestamp).toLocaleTimeString('en', {
				hour: '2-digit',
				minute: '2-digit',
			}),
			'Sale ID': sale._id,
			Operator: sale.operatorName,
			Helper:
				itemIndex === 0
					? sale.isHelper === undefined
						? ''
						: sale.isHelper
							? 'Yes'
							: 'No'
					: '',
			Product: item.productName,
			Quantity: item.quantity,
			'Unit price': formatCurrency(item.unitPrice),
			'Line total': formatCurrency(item.lineTotal),
			'Sale total': itemIndex === 0 ? formatCurrency(sale.total) : '',
			_saleId: sale._id as Id<'sales'>,
			_isFirstRow: itemIndex === 0,
		})),
	),
);

const {
	mutate: revertSale,
	isPending: isReverting,
	error: revertError,
} = useConvexMutation(api.transactions.revertSale);
const revertSaleId = ref<Id<'sales'> | null>(null);
const revertOpen = ref(false);
const revertSaleTotal = computed(() =>
	formatCurrency(
		sales.value.find((sale) => sale._id === revertSaleId.value)?.total ?? 0,
	),
);
const revertDescription = computed(() =>
	revertSaleId.value
		? `This will delete sale ${revertSaleId.value} (${revertSaleTotal.value}), remove its items, and restore the sold stock to inventory.`
		: '',
);
const revertErrorMessage = computed(() =>
	revertError.value instanceof Error
		? revertError.value.message
		: 'Please try again.',
);

function askRevertSale(saleId: Id<'sales'>) {
	revertSaleId.value = saleId;
	revertOpen.value = true;
}

async function confirmRevert() {
	if (!revertSaleId.value || isReverting.value) return;
	try {
		await revertSale({ saleId: revertSaleId.value });
		revertOpen.value = false;
		revertSaleId.value = null;
	} catch {
		// Keep the confirmation open so the operator can retry.
	}
}

const saleColumns: TableColumn<SaleRow>[] = [
	{
		accessorKey: 'Time',
		header: 'Time',
	},
	{
		accessorKey: 'Sale ID',
		header: 'Sale ID',
	},
	{
		accessorKey: 'Operator',
		header: 'Operator',
	},
	{
		accessorKey: 'Helper',
		header: 'Helper',
	},
	{
		accessorKey: 'Product',
		header: 'Product',
	},
	{
		accessorKey: 'Quantity',
		header: 'Quantity',
	},
	{
		accessorKey: 'Unit price',
		header: 'Unit price',
	},
	{
		accessorKey: 'Line total',
		header: 'Line total',
	},
	{
		accessorKey: 'Sale total',
		header: 'Sale total',
	},
	{
		id: 'revert',
		header: '',
		cell: ({ row }) => {
			const original = row.original as SaleRow;
			if (!original._isFirstRow) return '';
			return h(UButton, {
				label: 'Revert',
				color: 'error',
				variant: 'subtle',
				size: 'sm',
				class: 'min-h-10',
				disabled: isReverting.value,
				'aria-label': `Revert sale ${original._saleId}`,
				onClick: () => askRevertSale(original._saleId),
			});
		},
	},
];
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
		'Helper',
		'Product',
		'Quantity',
		'Unit price',
		'Line total',
		'Sale total',
	];
	const body = saleRows.value.map((row) =>
		headers
			.map((header) =>
				csvCell(row[header as keyof typeof row] as string | number),
			)
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
