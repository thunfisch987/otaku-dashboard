<template>
	<UCard>
		<template #header>
			<div>
				<h2 class="text-lg font-semibold">Shared Onigiri prices</h2>
				<p class="mt-1 text-sm text-muted">
					Every product in the Onigiri category uses these prices in
					preorders and at checkout.
				</p>
			</div>
		</template>
		<div class="space-y-4">
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
					:hint="`Defaults to €${ONIGIRI_DEFAULT_PRICE.toFixed(2)} when left empty`"
				>
					<UInput
						v-model="state.price"
						type="number"
						min="0.01"
						step="0.01"
					/>
				</UFormField>
				<UFormField
					label="Helper price (€)"
					hint="Optional; helpers pay the regular price when this is empty."
				>
					<UInput
						v-model="state.helperPrice"
						type="number"
						min="0"
						step="0.01"
						placeholder="Use regular price"
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
						Could not load how many products and forms are affected.
						Saving still reprices every Onigiri product at POS and
						in preorders.
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
	</UCard>
</template>

<script setup lang="ts">
import { api } from '#convex/api';
import { ONIGIRI_DEFAULT_PRICE } from '~~/convex/sharedConstants';

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
const toast = useToast();

watch(
	() => [pricing.value?.price, pricing.value?.helperPrice] as const,
	([price, helperPrice]) => {
		state.price = price === undefined ? '' : String(price);
		state.helperPrice =
			helperPrice === undefined ? '' : String(helperPrice);
	},
	{ immediate: true },
);

const errorMessage = computed(() => {
	if (!error.value) return '';
	return error.value instanceof Error
		? error.value.message
		: 'Please try again.';
});

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(
		amount,
	);

/** The regular/helper prices this save would write. */
const plannedPrices = computed(() => {
	const regularInput = String(state.price).trim();
	// An empty field uses the documented default instead of parsing to 0.
	const regular = regularInput
		? Number(regularInput.replace(',', '.'))
		: ONIGIRI_DEFAULT_PRICE;
	const helperInput = String(state.helperPrice).trim();
	const helper = helperInput ? Number(helperInput.replace(',', '.')) : null;
	return { regular, helper };
});

/** Pre-save statement of what saving these prices affects. */
const impactStatement = computed<string | null>(() => {
	const result = impact.value;
	const planned = plannedPrices.value;
	if (!result || !Number.isFinite(planned.regular)) return null;
	// Invalid helper input would render a nonsense statement; the save
	// validation reports it instead.
	if (planned.helper !== null && !Number.isFinite(planned.helper)) {
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
	// An empty regular field uses the documented €3 default instead of
	// parsing to 0 and zeroing every Onigiri product.
	const { regular, helper: helperPrice } = plannedPrices.value;
	if (!Number.isFinite(regular) || regular <= 0) {
		return toast.add({
			title: 'Enter an Onigiri regular price above €0',
			color: 'error',
		});
	}
	if (
		helperPrice !== null &&
		(!Number.isFinite(helperPrice) || helperPrice < 0)
	) {
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
