<template>
	<div
		v-if="variant === 'grouped'"
		class="space-y-3"
	>
		<article
			v-for="sale in sales"
			:key="sale._id"
			class="rounded-lg border border-default bg-default"
		>
			<header
				class="flex items-start justify-between gap-3 border-b border-default p-3"
			>
				<div class="min-w-0">
					<p class="font-semibold tabular-nums">
						{{ formatSaleTime(sale.timestamp) }}
					</p>
					<p class="text-sm text-muted">
						{{ sale.operatorName }}
						<template v-if="sale.isHelper !== undefined">
							· Helper: {{ sale.isHelper ? 'Yes' : 'No' }}
						</template>
					</p>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<div class="text-right">
						<p class="text-xs text-muted">Sale total</p>
						<p class="font-semibold tabular-nums">
							{{ formatCurrency(sale.total) }}
						</p>
					</div>
					<UButton
						icon="i-lucide-rotate-ccw"
						color="error"
						variant="ghost"
						class="-mr-1 min-h-11 min-w-11 justify-center"
						:disabled="isReverting"
						:aria-label="`Revert sale ${sale._id}`"
						title="Revert this sale"
						@click="emit('revert', sale._id)"
					/>
				</div>
			</header>
			<ul class="divide-y divide-default">
				<li
					v-for="(item, index) in sale.items"
					:key="index"
					class="flex items-baseline justify-between gap-3 px-3 py-2 text-sm"
				>
					<span class="flex min-w-0 flex-wrap items-baseline gap-x-1">
						<span class="font-medium break-words">{{
							item.productName
						}}</span>
						<span class="text-muted">× {{ item.quantity }}</span>
					</span>
					<span class="shrink-0 text-right tabular-nums">
						{{ formatCurrency(item.lineTotal) }}
						<span
							v-if="item.quantity > 1"
							class="block text-xs text-muted"
						>
							{{ formatCurrency(item.unitPrice) }} each
						</span>
					</span>
				</li>
			</ul>
		</article>
	</div>

	<ul
		v-else
		class="divide-y divide-default rounded-xl border border-default px-3"
	>
		<li
			v-for="sale in sales"
			:key="sale._id"
			class="flex items-start justify-between gap-3 py-2"
		>
			<div class="min-w-0 text-sm">
				<p>
					<span class="font-medium tabular-nums">{{
						formatSaleTime(sale.timestamp)
					}}</span>
					<span class="text-muted"> · {{ sale.operatorName }}</span>
				</p>
				<p class="text-muted">
					{{ summarizeSaleItems(sale.items) }}
				</p>
			</div>
			<span class="shrink-0 text-sm font-medium tabular-nums">{{
				formatCurrency(sale.total)
			}}</span>
		</li>
	</ul>
</template>

<script setup lang="ts">
import type { SaleWithItems } from './types';
import { formatCurrency, formatSaleTime, summarizeSaleItems } from './format';

withDefaults(
	defineProps<{
		sales: SaleWithItems[];
		variant?: 'grouped' | 'compact';
		isReverting?: boolean;
	}>(),
	{
		variant: 'grouped',
		isReverting: false,
	},
);

const emit = defineEmits<{
	revert: [saleId: string];
}>();
</script>
