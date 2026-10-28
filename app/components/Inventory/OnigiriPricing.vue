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
				>
					<UInput
						v-model="state.price"
						type="number"
						min="0"
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
				<div class="sm:col-span-2">
					<UButton
						label="Save Onigiri prices"
						type="submit"
						class="min-h-11"
						:loading="saving"
						:disabled="saving || !convexAuthenticated"
					/>
				</div>
			</UForm>
		</div>
	</UCard>
</template>

<script setup lang="ts">
import { api } from '#convex/api';

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

async function savePricing() {
	const price = Number(String(state.price).trim().replace(',', '.'));
	const helperPriceInput = String(state.helperPrice).trim();
	const helperPrice = helperPriceInput
		? Number(helperPriceInput.replace(',', '.'))
		: null;
	if (!Number.isFinite(price) || price < 0) {
		return toast.add({
			title: 'Enter a valid non-negative Onigiri price',
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
	if (helperPrice !== null && helperPrice > price) {
		return toast.add({
			title: 'Helper price cannot be higher than regular price',
			color: 'error',
		});
	}
	try {
		await updatePricing({ price, helperPrice });
		toast.add({ title: 'Shared Onigiri prices saved', color: 'success' });
	} catch {
		// The mutation error is shown above the save button.
	}
}
</script>
