<template>
	<UCollapsible
		v-model:open="open"
		:unmount-on-hide="false"
		class="rounded-lg bg-default ring ring-default"
	>
		<button
			type="button"
			class="flex w-full items-start justify-between gap-4 p-4 text-left sm:px-6"
		>
			<span class="min-w-0">
				<span class="block text-lg font-semibold">
					Shared Onigiri prices
				</span>
				<span class="mt-1 block text-sm text-muted">
					{{ headerSummary }}
				</span>
				<span
					v-if="hasUnsavedEdits"
					class="mt-1 block text-sm text-warning"
				>
					Unsaved changes — expand to review or save.
				</span>
			</span>
			<UIcon
				name="i-lucide-chevron-down"
				class="mt-1 size-5 shrink-0 text-muted transition-transform duration-200"
				:class="{ 'rotate-180': open }"
			/>
		</button>
		<template #content>
			<div class="space-y-4 border-t border-default p-4 sm:p-6">
				<div
					v-if="convexAuthLoading || pricingPending"
					class="text-sm text-muted"
				>
					Loading shared prices…
				</div>
				<UAlert
					v-else-if="pricingError"
					title="Shared Onigiri prices could not be loaded"
					description="Refresh the page and try again."
					color="error"
					icon="i-lucide-circle-alert"
				/>
				<UForm
					v-else
					:state="state"
					class="grid gap-4 sm:grid-cols-2"
					@submit="savePricing"
				>
					<UFormField
						label="Regular price (€)"
						required
						:hint="`Defaults to ${formatCurrency(ONIGIRI_DEFAULT_PRICE)} when left empty`"
					>
						<UInput
							v-model="state.price"
							inputmode="decimal"
							placeholder="0,00"
							:disabled="saving"
							@input="edited.price = true"
						/>
					</UFormField>
					<UFormField
						label="Helper price (€)"
						hint="Optional; helpers pay the regular price when this is empty."
					>
						<UInput
							v-model="state.helperPrice"
							inputmode="decimal"
							placeholder="Use regular price"
							:disabled="saving"
							@input="edited.helperPrice = true"
						/>
					</UFormField>
					<UAlert
						v-if="errorMessage"
						class="sm:col-span-2"
						title="Could not save shared prices"
						:description="errorMessage"
						color="error"
						icon="i-lucide-circle-alert"
					/>
					<div
						v-if="impactPending || impactError || impactStatement"
						class="rounded-lg border p-3 text-sm sm:col-span-2"
						role="status"
					>
						<p
							v-if="impactPending"
							class="text-muted"
						>
							Calculating how many products and forms this would
							reprice…
						</p>
						<p
							v-else-if="impactError"
							class="text-muted"
						>
							Could not load how many products and forms are
							affected. Saving still reprices every Onigiri
							product at POS and in preorders.
						</p>
						<p
							v-else-if="impactStatement"
							class="text-default"
						>
							{{ impactStatement }}
						</p>
					</div>
					<div class="sm:col-span-2">
						<UButton
							label="Save Onigiri prices"
							type="submit"
							class="min-h-11"
							:loading="saving"
							:disabled="
								saving || !convexAuthenticated || impactPending
							"
						/>
					</div>
				</UForm>
			</div>
		</template>
	</UCollapsible>
</template>

<script setup lang="ts">
import { api } from '#convex/api';
import { ONIGIRI_DEFAULT_PRICE } from '~~/convex/sharedConstants';
import { formatCurrency, formatMoneyInput } from '~/utils/currency';
import { parseProductMoney } from './types';

const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useAppConvexAuth();
const queryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);
const {
	data: pricing,
	isPending: pricingPending,
	error: pricingError,
} = useConvexQuery(api.products.getOnigiriPricing, queryArgs, {
	server: false,
});
// The client clock is passed so the backend can count forms that are still
// open without reading the wall clock itself.
const impactArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value
		? 'skip'
		: { now: Date.now() },
);
const {
	data: impact,
	isPending: impactPending,
	error: impactError,
} = useConvexQuery(api.products.getOnigiriPricingImpact, impactArgs, {
	server: false,
});
const {
	mutate: updatePricing,
	isPending: saving,
	error,
} = useConvexMutation(api.products.updateOnigiriPricing);
const state = reactive({ price: '', helperPrice: '' });
// The text the form was prefilled with. An untouched field saves the stored
// number exactly, so a two-decimal display can never round stored data.
const prefilled = { price: '', helperPrice: '' };
// Edits are tracked per field: retyping the prefilled text is still an edit,
// and must save what the operator typed rather than the stored value.
const edited = reactive({ price: false, helperPrice: false });
const toast = useToast();
// Collapsed by default so the form does not push the product table down; the
// header still shows the current prices so they can be read at a glance.
const open = ref(false);
const hasUnsavedEdits = computed(() => edited.price || edited.helperPrice);

/** Apply subscription prices to the fields the operator has not edited. */
function applyPricing(
	price: number | undefined,
	helperPrice: number | undefined,
) {
	const nextPrice = price === undefined ? '' : formatMoneyInput(price);
	const nextHelper =
		helperPrice === undefined ? '' : formatMoneyInput(helperPrice);
	// A remote change to one price must not discard an in-progress edit to
	// the other field, and retyped text keeps its own edit flag.
	if (!edited.price) {
		prefilled.price = nextPrice;
		state.price = nextPrice;
	}
	if (!edited.helperPrice) {
		prefilled.helperPrice = nextHelper;
		state.helperPrice = nextHelper;
	}
}

watch(
	() => [pricing.value?.price, pricing.value?.helperPrice] as const,
	([price, helperPrice]) => applyPricing(price, helperPrice),
	{ immediate: true },
);

/**
 * Parse a typed price. A leading separator means a fraction of a euro
 * (`,50`), which the old number input accepted; a bare separator stays
 * invalid, as does anything that is not a plain decimal.
 */
function parseTypedPrice(input: string) {
	return /^[.,]/.test(input)
		? /^[.,]\d{1,2}$/.test(input)
			? parseProductMoney(`0${input}`)
			: undefined
		: parseProductMoney(input);
}

const errorMessage = computed(() => {
	if (!error.value) return '';
	return error.value instanceof Error
		? error.value.message
		: 'Please try again.';
});

/** One-line state shown while the form is collapsed. */
const headerSummary = computed(() => {
	if (convexAuthLoading.value || pricingPending.value) {
		return 'Loading shared prices…';
	}
	if (pricingError.value) {
		return 'Shared prices could not be loaded';
	}
	const current = pricing.value;
	if (!current) {
		return 'Not configured yet';
	}
	const helper =
		current.helperPrice === undefined
			? 'helpers pay the regular price'
			: `helpers pay ${formatCurrency(current.helperPrice)}`;
	return `Regular ${formatCurrency(current.price)} · ${helper}`;
});

/** The regular/helper prices this save would write. */
const plannedPrices = computed(() => {
	const regularInput = String(state.price).trim();
	const helperInput = String(state.helperPrice).trim();
	// An empty field uses the documented default instead of parsing to 0.
	// Typed values must be plain decimals: Number() alone would also accept
	// hexadecimal and exponent input. An untouched field keeps the stored
	// value as-is rather than the rounded text the input displays.
	const regular =
		regularInput === ''
			? ONIGIRI_DEFAULT_PRICE
			: !edited.price &&
				  regularInput === prefilled.price &&
				  pricing.value?.price !== undefined
				? pricing.value.price
				: parseTypedPrice(regularInput);
	const helper =
		helperInput === ''
			? null
			: !edited.helperPrice &&
				  helperInput === prefilled.helperPrice &&
				  pricing.value?.helperPrice !== undefined
				? pricing.value.helperPrice
				: parseTypedPrice(helperInput);
	return { regular, helper };
});

/** Pre-save statement of what saving these prices affects. */
const impactStatement = computed<string | null>(() => {
	const result = impact.value;
	const planned = plannedPrices.value;
	// Invalid input, a sub-cent regular price, or a helper above the regular
	// price would render a false statement; the save validation reports it.
	if (
		!result ||
		planned.regular === undefined ||
		planned.regular < 0.01 ||
		planned.helper === undefined ||
		(planned.helper !== null && planned.helper > planned.regular)
	) {
		return null;
	}
	const { onigiriProductCount, activeFormCount, countsTruncated } = result;
	const atLeast = countsTruncated ? 'at least ' : '';
	const plural = (count: number) => (count === 1 ? '' : 's');
	const helperPart =
		planned.helper === null
			? 'helpers pay the regular price'
			: `helpers pay ${formatCurrency(planned.helper)}`;
	return `Saving writes regular ${formatCurrency(planned.regular)} (${helperPart}) and reprices ${atLeast}${onigiriProductCount} Onigiri product${plural(
		onigiriProductCount,
	)} at POS and in ${activeFormCount} active preorder form${plural(
		activeFormCount,
	)}.`;
});

async function savePricing() {
	// An empty regular field uses the documented 3,00 € default instead of
	// parsing to 0 and zeroing every Onigiri product.
	const { regular, helper: helperPrice } = plannedPrices.value;
	if (regular === undefined) {
		return toast.add({
			title: 'Enter a valid Onigiri regular price with up to two decimals',
			color: 'error',
		});
	}
	if (regular < 0.01) {
		return toast.add({
			title: `Enter an Onigiri regular price of at least ${formatCurrency(0.01)}`,
			color: 'error',
		});
	}
	if (helperPrice === undefined) {
		return toast.add({
			title: 'Enter a valid non-negative helper price with up to two decimals',
			color: 'error',
		});
	}
	if (helperPrice !== null && helperPrice < 0) {
		return toast.add({
			title: 'Enter a valid non-negative helper price',
			color: 'error',
		});
	}
	if (helperPrice !== null && helperPrice > regular) {
		return toast.add({
			title: 'Helper price cannot be higher than regular price',
			color: 'error',
		});
	}
	try {
		await updatePricing({ price: regular, helperPrice });
		// The saved prices are authoritative again; the subscription refresh
		// can now repopulate both fields. Apply it here too, because an update
		// that arrived during the save was skipped while the flags were set.
		edited.price = false;
		edited.helperPrice = false;
		applyPricing(pricing.value?.price, pricing.value?.helperPrice);
		// Counted statements live in the pre-save summary above the button;
		// the toast stays count-free so it can never quote stale numbers.
		toast.add({
			title: 'Shared Onigiri prices saved — every Onigiri product now uses these prices',
			color: 'success',
		});
	} catch {
		// The mutation error is shown above the save button.
	}
}
</script>
