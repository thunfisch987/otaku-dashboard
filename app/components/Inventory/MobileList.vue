<template>
	<div class="space-y-3">
		<div
			v-if="!loading && rows.length > 0"
			class="flex items-center justify-between gap-3"
		>
			<label class="flex min-h-11 items-center gap-2 text-sm font-medium">
				<UCheckbox
					:model-value="
						allSelected
							? true
							: someSelected
								? 'indeterminate'
								: false
					"
					aria-label="Select all products on this page"
					@update:model-value="toggleAll"
				/>
				Select all
			</label>
			<p class="text-sm text-muted">{{ selectedCount }} selected</p>
		</div>

		<ul
			v-if="loading"
			class="space-y-3"
			aria-label="Loading products"
			role="status"
		>
			<li
				v-for="placeholder in 3"
				:key="placeholder"
				class="h-28 animate-pulse rounded-lg border border-default bg-elevated"
			/>
		</ul>

		<ul
			v-else
			class="space-y-3"
		>
			<li
				v-for="row in rows"
				:key="row.original._id"
				class="rounded-lg border border-default bg-default p-3"
			>
				<div class="flex items-start gap-3">
					<label
						class="-m-3 flex size-11 shrink-0 cursor-pointer items-center justify-center"
					>
						<UCheckbox
							:model-value="row.getIsSelected()"
							:aria-label="`Select ${row.original.productname}`"
							@update:model-value="
								(value) => row.toggleSelected(!!value)
							"
						/>
					</label>

					<!-- Compact: the whole name/price block is the expand trigger,
					so the card needs no separate "Details" row. -->
					<div
						v-if="variant === 'compact'"
						class="min-w-0 flex-1"
					>
						<button
							type="button"
							class="flex w-full items-start justify-between gap-2 text-left"
							:aria-expanded="isExpanded(row.original._id)"
							:aria-controls="detailsId(row.original._id)"
							@click="toggleExpanded(row.original._id)"
						>
							<span class="min-w-0">
								<span class="block font-medium break-words">{{
									row.original.productname
								}}</span>
								<span
									class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"
								>
									<UBadge
										:color="
											stockSummary(row.original.amount)
												.color
										"
										variant="subtle"
									>
										{{
											stockSummary(row.original.amount)
												.label
										}}
									</UBadge>
									<span class="text-sm tabular-nums">
										<span class="font-medium">{{
											formatCurrency(row.original.price)
										}}</span
										><span class="text-xs text-muted">
											·
											<span class="sr-only"
												>supplier </span
											>{{ row.original.supplier }}</span
										>
									</span>
								</span>
							</span>
							<UIcon
								:name="
									isExpanded(row.original._id)
										? 'i-lucide-chevron-up'
										: 'i-lucide-chevron-down'
								"
								class="mt-1 size-4 shrink-0 text-muted"
							/>
						</button>
					</div>

					<div
						v-else
						class="min-w-0 flex-1"
					>
						<p class="font-medium break-words">
							{{ row.original.productname }}
						</p>
						<div
							class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"
						>
							<UBadge
								:color="stockSummary(row.original.amount).color"
								variant="subtle"
							>
								{{ stockSummary(row.original.amount).label }}
							</UBadge>
							<span class="text-sm font-medium tabular-nums">
								{{ formatCurrency(row.original.price) }}
							</span>
						</div>
					</div>

					<UDropdownMenu
						:items="rowItems(row)"
						:content="{ align: 'end' }"
					>
						<UButton
							icon="i-lucide-ellipsis-vertical"
							color="neutral"
							variant="ghost"
							class="min-h-11 min-w-11 justify-center"
							:aria-label="`Actions for ${row.original.productname}`"
						/>
					</UDropdownMenu>
				</div>

				<InventoryMobileDetails
					v-if="variant === 'cards'"
					:product="row.original"
					class="mt-3 border-t border-default pt-3"
				/>
				<div
					v-else-if="isExpanded(row.original._id)"
					:id="detailsId(row.original._id)"
					class="mt-3 border-t border-default pt-3"
				>
					<InventoryMobileDetails
						:product="row.original"
						:exclude="['Supplier']"
					/>
				</div>
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
import type { Row, Table } from '@tanstack/vue-table';
import type { ProductSchema } from './types';
import { getRowItems } from './columns';
import { formatCurrency, stockSummary } from './format';

const props = defineProps<{
	rows: Row<ProductSchema>[];
	tableApi?: Table<ProductSchema> | null;
	variant: 'cards' | 'compact';
	loading?: boolean;
}>();

const emit = defineEmits<{
	delete: [product: ProductSchema];
}>();

const expandedRows = ref<Set<string>>(new Set());

const allSelected = computed(
	() => props.tableApi?.getIsAllPageRowsSelected() ?? false,
);
const someSelected = computed(
	() => props.tableApi?.getIsSomePageRowsSelected() ?? false,
);
const selectedCount = computed(
	() =>
		props.tableApi?.getFilteredSelectedRowModel().rows.length ??
		props.rows.filter((row) => row.getIsSelected()).length,
);

function toggleAll(value: boolean | 'indeterminate') {
	props.tableApi?.toggleAllPageRowsSelected(!!value);
}

function detailsId(productId: string) {
	return `product-details-${productId}`;
}

function isExpanded(productId: string) {
	return expandedRows.value.has(productId);
}

function toggleExpanded(productId: string) {
	const next = new Set(expandedRows.value);
	if (next.has(productId)) next.delete(productId);
	else next.add(productId);
	expandedRows.value = next;
}

function rowItems(row: Row<ProductSchema>) {
	return getRowItems(row, {
		deleteProduct: (product) => emit('delete', product),
	});
}
</script>
