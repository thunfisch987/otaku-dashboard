<template>
	<div class="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
		<!-- Loading -->
		<div
			v-if="formIsPending"
			class="py-12 text-center text-muted"
			role="status"
		>
			Loading preorder form…
		</div>

		<!-- Success (kept visible even if the form later closes server-side) -->
		<UCard
			v-else-if="submitted"
			role="status"
		>
			<div class="flex flex-col items-center gap-3 py-4 text-center">
				<UIcon
					name="i-lucide-circle-check"
					class="text-4xl text-success"
				/>
				<h2
					id="preorder-success-heading"
					ref="stateHeading"
					tabindex="-1"
					class="text-xl font-semibold outline-none"
				>
					Order received
				</h2>
				<p class="text-muted">
					Thanks {{ submitted.firstName }}! Your preorder has been
					saved.
				</p>
				<p class="text-sm text-muted">
					Please pay in cash when picking up your order at the event.
				</p>
			</div>

			<ul
				v-if="submitted.items.length"
				aria-label="Ordered items"
				class="divide-y rounded-lg border p-0"
			>
				<li
					v-for="line in submitted.items"
					:key="line.key"
					class="flex items-center justify-between gap-4 px-4 py-2"
				>
					<span class="text-sm text-default">
						<span class="font-medium">{{ line.name }}</span> ×
						{{ line.quantity }}
					</span>
					<span class="text-sm tabular-nums text-muted">
						{{ formatCurrency(line.lineTotal) }}
					</span>
				</li>
			</ul>

			<div
				v-if="submitted.items.length"
				class="flex items-center justify-between px-4 pt-3"
			>
				<span class="font-semibold">Total (payable in cash)</span>
				<span class="font-semibold tabular-nums">
					{{ formatCurrency(reviewTotal) }}
				</span>
			</div>

			<UButton
				block
				class="mt-5"
				color="neutral"
				size="xl"
				variant="outline"
				@click="startNewOrder"
			>
				Make another order
			</UButton>
		</UCard>

		<!-- Query failed -->
		<UAlert
			v-else-if="formError"
			title="Preorder form could not be loaded"
			:description="
				formError instanceof Error
					? formError.message
					: 'Please check the link and try again.'
			"
			color="error"
			icon="i-lucide-circle-alert"
			variant="subtle"
		/>

		<!-- Not found -->
		<UCard v-else-if="!preorderForm">
			<div class="flex flex-col items-center gap-3 py-6 text-center">
				<UIcon
					name="i-lucide-file-question"
					class="text-4xl text-muted"
				/>
				<h2 class="text-xl font-semibold">Preorders are unavailable</h2>
				<p class="text-muted">
					This form is inactive, closed, or the link is invalid.
				</p>
			</div>
		</UCard>

		<!-- Closed -->
		<UCard v-else-if="isClosed">
			<div class="flex flex-col items-center gap-3 py-6 text-center">
				<UIcon
					name="i-lucide-lock"
					class="text-4xl text-muted"
				/>
				<h2
					id="preorder-closed-heading"
					ref="stateHeading"
					tabindex="-1"
					class="text-xl font-semibold outline-none"
				>
					Preorders are closed
				</h2>
				<p class="text-muted">
					{{
						closeNotice
							? `The preorder window closed on ${closeNotice}.`
							: 'This preorder form is no longer accepting orders.'
					}}
				</p>
			</div>
		</UCard>

		<!-- Active form flow -->
		<div v-else-if="preorderForm">
			<header class="space-y-1">
				<h1 class="text-2xl font-semibold">
					{{ preorderForm.name ?? 'Preorder' }}
				</h1>
				<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
					<span
						v-if="preorderForm.eventDate"
						class="text-sm text-muted"
					>
						Event: {{ formatDate(preorderForm.eventDate) }}
					</span>
					<UBadge
						v-if="preorderForm.closeAt"
						color="primary"
						variant="subtle"
					>
						Open until {{ formatDateTime(preorderForm.closeAt) }}
					</UBadge>
					<UBadge
						v-else
						color="primary"
						variant="subtle"
					>
						Open for preorders
					</UBadge>
				</div>
			</header>

			<UStepper
				:items="steps"
				:disabled="isSubmitting"
				:model-value="stepIndex"
				class="mt-4"
				size="lg"
				@update:model-value="onStepClick"
			/>

			<UAlert
				v-if="submitError"
				:description="submitError"
				color="error"
				icon="i-lucide-circle-alert"
				title="Order could not be submitted"
				role="alert"
				variant="subtle"
				class="mt-4"
			/>

			<!-- Step: details -->
			<section
				v-if="currentStepKey === 'details'"
				aria-labelledby="details-heading"
				class="mt-6 space-y-4"
			>
				<h2
					id="details-heading"
					ref="stepHeading"
					tabindex="-1"
					class="text-xl font-semibold outline-none"
				>
					Your details
				</h2>

				<div class="grid gap-4 sm:grid-cols-2">
					<UFormField
						label="First name"
						name="firstName"
						required
					>
						<UInput
							v-model="firstName"
							autocomplete="given-name"
							class="w-full"
							placeholder="First name"
							size="xl"
						/>
					</UFormField>
					<UFormField
						label="Last name"
						name="lastName"
						required
					>
						<UInput
							v-model="lastName"
							autocomplete="family-name"
							class="w-full"
							placeholder="Last name"
							size="xl"
						/>
					</UFormField>
				</div>

				<UFormField
					label="Are you a helper?"
					name="isHelper"
					required
				>
					<URadioGroup
						v-model="helperChoice"
						:items="[
							{
								label: 'Yes, I am helping at this event',
								value: 'yes',
							},
							{ label: 'No', value: 'no' },
						]"
					/>
				</UFormField>

				<p class="text-sm text-muted">
					We only need your name to find you on pickup day.
				</p>
			</section>

			<!-- Step: product section -->
			<section
				v-else-if="currentSection"
				:aria-label="`Order ${currentSection.title}`"
				class="mt-6 space-y-4"
			>
				<h2
					id="section-heading"
					ref="stepHeading"
					tabindex="-1"
					class="text-xl font-semibold outline-none"
				>
					{{ currentSection.title }}
				</h2>

				<div
					v-if="currentSection.items.length === 0"
					class="rounded-lg border p-4 text-center text-muted"
				>
					Nothing is offered in this section right now.
				</div>
				<ul
					v-else
					class="grid gap-3 sm:grid-cols-2"
				>
					<li
						v-for="item in currentSection.items"
						:key="item.key"
						class="rounded-xl border p-4"
					>
						<div class="flex items-start gap-3">
							<img
								v-if="item.picture"
								:src="item.picture"
								:alt="item.name"
								class="h-12 w-12 shrink-0 rounded-lg object-cover"
							/>
							<div class="min-w-0 flex-1">
								<p class="font-semibold">
									{{ item.name }}
								</p>
								<p class="text-sm text-muted">
									{{ formatCurrency(item.price) }} each
								</p>
							</div>
						</div>
						<div
							class="mt-3 flex items-center justify-between gap-3"
						>
							<UButton
								:aria-label="`Remove one ${item.name}`"
								:aria-controls="`qty-${item.key}`"
								:disabled="quantity(item.key) === 0"
								color="neutral"
								icon="i-lucide-minus"
								variant="outline"
								size="xl"
								@click="changeQuantity(item.key, -1)"
							/>
							<span
								:id="`qty-${item.key}`"
								aria-live="polite"
								class="min-w-8 text-center text-lg font-semibold tabular-nums"
							>
								{{ quantity(item.key) }}
							</span>
							<UButton
								:aria-label="`Add one ${item.name}`"
								:aria-controls="`qty-${item.key}`"
								:disabled="!canIncreaseQuantity(item.key)"
								color="neutral"
								icon="i-lucide-plus"
								variant="outline"
								size="xl"
								@click="changeQuantity(item.key, 1)"
							/>
						</div>
					</li>
				</ul>
				<p
					v-if="
						totalSelectedQuantity >= maxOrderTotal ||
						selectedLineCount >= maxOrderLines
					"
					class="text-sm text-muted"
					role="status"
				>
					The order limit has been reached. You can order up to
					{{ maxOrderTotal }} items and {{ maxOrderLines }} different
					products.
				</p>
				<p class="text-xs text-muted">
					Prices are per item. Images may differ from the actual
					dishes.
				</p>
			</section>

			<!-- Step: review and confirm -->
			<section
				v-else
				aria-labelledby="review-heading"
				class="mt-6 space-y-4"
			>
				<h2
					id="review-heading"
					ref="stepHeading"
					tabindex="-1"
					class="text-xl font-semibold outline-none"
				>
					Review your order
				</h2>

				<UAlert
					v-if="duplicateOrderHint"
					title="Is this a second order?"
					description="Your earlier attempt may still have gone through even though you saw an error. Submitting this order unchanged again is safe. If this changed order also goes through, it will be a second order — an organizer can remove the extra one."
					color="warning"
					icon="i-lucide-circle-alert"
					variant="subtle"
					role="status"
				/>

				<div
					v-if="selectedLines.length === 0"
					class="rounded-lg border p-4 text-center text-muted"
				>
					You have not selected any items yet.
				</div>
				<ul
					v-else
					class="divide-y rounded-lg border p-0"
				>
					<li
						v-for="line in selectedLines"
						:key="line.key"
						class="flex items-center justify-between gap-4 px-4 py-2"
					>
						<span class="text-sm text-default">
							<span class="font-medium">{{ line.name }}</span>
							× {{ line.quantity }}
						</span>
						<span class="text-sm tabular-nums text-muted">
							{{ formatCurrency(line.lineTotal) }}
						</span>
					</li>
					<li
						class="flex items-center justify-between gap-4 px-4 py-2"
					>
						<span class="font-semibold">Total</span>
						<span class="font-semibold tabular-nums">
							{{ formatCurrency(reviewTotal) }}
						</span>
					</li>
				</ul>

				<div class="space-y-1 rounded-lg border p-4 text-sm">
					<p>
						Ordered under:
						<span class="font-medium">{{ fullName }}</span>
					</p>
					<p class="text-muted">
						Helper: {{ isHelper ? 'Yes' : 'No' }}
					</p>
					<p class="text-muted">
						Payment is only possible on-site in cash.
					</p>
				</div>

				<UFormField
					name="confirmed"
					required
				>
					<UCheckbox
						v-model="confirmed"
						label="I confirm that I will pay for this order in cash at the event."
					/>
				</UFormField>
			</section>

			<!-- Back / Next / Submit -->
			<div class="mt-8 flex items-center justify-between gap-4">
				<UButton
					:disabled="isSubmitting || stepIndex === 0"
					color="neutral"
					size="xl"
					variant="subtle"
					@click="goBack"
				>
					Back
				</UButton>
				<UButton
					v-if="currentStepKey !== 'review'"
					:disabled="!canLeaveStep || isSubmitting"
					size="xl"
					trailing-icon="i-lucide-arrow-right"
					@click="goNext"
				>
					Next
				</UButton>
				<UButton
					v-else
					:disabled="!canSubmit"
					:loading="isSubmitting"
					color="primary"
					icon="i-lucide-send"
					size="xl"
					@click="submitPreorder"
				>
					Place order
				</UButton>
			</div>
			<p
				v-if="currentStepKey === 'details' && !canLeaveStep"
				class="mt-2 text-sm text-muted"
			>
				Enter your first and last name and choose whether you are a
				helper to continue.
			</p>
			<p
				v-else-if="
					currentStepKey === 'review' && selectedLines.length === 0
				"
				class="mt-2 text-sm text-muted"
			>
				Select at least one item to place an order.
			</p>
			<p
				v-else-if="currentStepKey === 'review' && !confirmed"
				class="mt-2 text-sm text-muted"
			>
				Confirm the cash payment to place your order.
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
// ---------------------------------------------------------------------------
// Public preorder form (/preorder/<slug>). Contract with convex/preorders.ts:
// - `api.preorders.publicForm({ slug, now })` returns a known form, including
//   `status: 'open' | 'closed'`, or null only when the slug is unknown:
//   { _id, name, eventDate, closeAt: number | null, isActive, includeFood,
//     includeSnacks, items: [{ productId, section: 'onigiri' | 'food' |
//     'snacks', productname, price, picture? }] } — items use ordinary product
//     names/prices; helper prices never reach this page. Once the form is
//     closed or inactive the server withholds all item data.
// - `api.preorders.submit({ slug, submissionToken, clientId, firstName,
//   lastName, isHelper, confirmed, items: [{ productId, quantity }] })` throws
//   when the form is closed or the submission is invalid. Repeating the same
//   token with the same submission is idempotent. `clientId` is an
//   unauthenticated browser identifier used for coarse rate limiting only.
// The optional close date is evaluated against a timestamp fixed at page
// load (Convex queries cannot read the wall clock); the locally ticking clock
// only flips the UI state in this component. Submit re-validates the open
// state against the server clock.
// Nothing here reserves stock or creates sales; helpers are recorded only
// as an operational flag for the POS.
// ---------------------------------------------------------------------------
import { api } from '#convex/api';
import { createRequestId } from '~/utils/requestId';
import {
	MAX_ORDER_LINES,
	MAX_QUANTITY_PER_LINE,
	MAX_TOTAL_QUANTITY,
} from '~~/convex/sharedConstants';

// Public customer page: minimal layout, no operator shell or shortcuts.
definePageMeta({ layout: 'public' });

type PreorderSection = 'onigiri' | 'food' | 'snacks';

// Shape of a hydrated item from api.preorders.publicForm.
interface PublicFormItem {
	productId: string;
	section: PreorderSection;
	productname: string;
	price: number;
	picture?: string;
}

interface SectionItem {
	key: string;
	productId: string;
	name: string;
	price: number;
	picture?: string;
}

interface OrderLine {
	key: string;
	productId: string;
	name: string;
	quantity: number;
	price: number;
	lineTotal: number;
}

const route = useRoute();
const slug = computed(() => String(route.params.slug ?? ''));

// Supply a timestamp fixed at page load so the subscription stays stable
// (a reactive clock would re-subscribe the whole form every tick). The server
// re-validates the open state against its own clock on every submit.
const mountedAt = Date.now();
const formArgs = computed(() =>
	slug.value ? { slug: slug.value, now: mountedAt } : 'skip',
);
const {
	data: formData,
	error: formError,
	isPending: formIsPending,
} = useConvexQuery(api.preorders.publicForm, formArgs, { server: false });

const preorderForm = computed(() => formData.value ?? null);
// Local clock only drives the closed-state flip in this component; it never
// feeds the query arguments.
const localNow = ref(Date.now());
let nowTimer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
	nowTimer = setInterval(() => {
		localNow.value = Date.now();
	}, 30_000);
});
onBeforeUnmount(() => {
	if (nowTimer) clearInterval(nowTimer);
});

const isClosed = computed(() => {
	const form = preorderForm.value;
	if (!form) return false;
	if (form.status === 'closed' || form.isActive === false) return true;
	return (
		typeof form.closeAt === 'number' &&
		form.closeAt > 0 &&
		localNow.value >= form.closeAt
	);
});

const closeNotice = computed(() => {
	const form = preorderForm.value;
	const closeAt = form?.closeAt;
	return form?.isActive === true &&
		typeof closeAt === 'number' &&
		closeAt > 0 &&
		closeAt <= localNow.value
		? formatDateTime(closeAt)
		: '';
});

// Sections shown, respecting "only configured food/snack sections; Onigiri
// always present". Items whose name/price are missing are skipped defensively.
const publicItems = computed<PublicFormItem[]>(
	() =>
		((preorderForm.value as { items?: PublicFormItem[] } | null)?.items ??
			[]) as PublicFormItem[],
);
const productSteps = computed(() => {
	const form = preorderForm.value;
	const usable = publicItems.value.filter(
		(item) =>
			typeof item.productId === 'string' &&
			typeof item.productname === 'string' &&
			Number.isFinite(item.price),
	);
	const mapItem = (item: PublicFormItem): SectionItem => ({
		key: `${item.section}:${item.productId}`,
		productId: item.productId,
		name: item.productname,
		price: item.price,
		picture: item.picture,
	});
	const steps: {
		key: PreorderSection;
		title: string;
		items: SectionItem[];
	}[] = [];
	if (form?.includeFood) {
		steps.push({
			key: 'food',
			title: 'Food',
			items: usable
				.filter((item) => item.section === 'food')
				.map(mapItem),
		});
	}
	if (form?.includeSnacks) {
		steps.push({
			key: 'snacks',
			title: 'Snacks',
			items: usable
				.filter((item) => item.section === 'snacks')
				.map(mapItem),
		});
	}
	steps.push({
		key: 'onigiri',
		title: 'Onigiri',
		items: usable.filter((item) => item.section === 'onigiri').map(mapItem),
	});
	return steps;
});

const steps = computed(() => [
	{ title: 'Details', icon: 'i-ph-user' },
	...productSteps.value.map((section) => ({
		title: section.title,
		icon:
			section.key === 'food'
				? 'i-ph-bowl-steam'
				: section.key === 'snacks'
					? 'i-ph-cookie'
					: 'i-ph-onigiri',
	})),
	{ title: 'Review & confirm', icon: 'i-ph-check-fat' },
]);

// The stepper allows direct navigation between sections. Required details,
// selected products, and confirmation are checked before submission, and the
// backend validates the complete request again.
const stepIndex = ref(0);
const currentStepKey = computed(() => {
	const lastIndex = steps.value.length - 1;
	if (stepIndex.value <= 0) return 'details';
	if (stepIndex.value >= lastIndex) return 'review';
	return productSteps.value[stepIndex.value - 1]?.key ?? 'details';
});
const currentSection = computed(
	() => productSteps.value[stepIndex.value - 1] ?? null,
);

function onStepClick(value: number | string | undefined) {
	const next = Number(value);
	if (Number.isFinite(next) && next >= 0 && next <= steps.value.length - 1) {
		stepIndex.value = next;
	}
}

// Focus each step heading when the step changes for keyboard/screen-reader use.
const stepHeading = useTemplateRef<HTMLHeadingElement>('stepHeading');
const stateHeading = useTemplateRef<HTMLHeadingElement>('stateHeading');
watch(stepIndex, () => {
	nextTick(() => stepHeading.value?.focus());
});

// Orderer details. The helper answer is explicit on purpose (radios) because
// it matters operationally at the point of sale.
const firstName = ref('');
const lastName = ref('');
const helperChoice = ref<'' | 'yes' | 'no'>('');
const isHelper = computed(() => helperChoice.value === 'yes');

const fullName = computed(() => {
	const name = `${firstName.value.trim()} ${lastName.value.trim()}`.trim();
	return name.length > 0 ? name : 'Unnamed order';
});

// Quantities, keyed by section+product. Nothing touches inventory here.
// Limits are shared with the backend (convex/sharedConstants.ts) so the UI
// can never drift from what the server actually enforces.
const maxQuantity = MAX_QUANTITY_PER_LINE;
const maxOrderLines = MAX_ORDER_LINES;
const maxOrderTotal = MAX_TOTAL_QUANTITY;
const quantities = reactive<Record<string, number>>({});

const totalSelectedQuantity = computed(() =>
	Object.values(quantities).reduce((total, value) => total + value, 0),
);
const selectedLineCount = computed(
	() => Object.values(quantities).filter((value) => value > 0).length,
);

function quantity(key: string) {
	return quantities[key] ?? 0;
}

function changeQuantity(key: string, delta: number) {
	const current = quantity(key);
	if (
		delta > 0 &&
		current === 0 &&
		selectedLineCount.value >= maxOrderLines
	) {
		return;
	}
	const maxForItem = Math.min(
		maxQuantity,
		maxOrderTotal - (totalSelectedQuantity.value - current),
	);
	const next = Math.min(maxForItem, Math.max(0, current + delta));
	quantities[key] = next;
}

function canIncreaseQuantity(key: string) {
	return (
		quantity(key) < maxQuantity &&
		totalSelectedQuantity.value < maxOrderTotal &&
		(quantity(key) > 0 || selectedLineCount.value < maxOrderLines)
	);
}

const selectedLines = computed<OrderLine[]>(() =>
	productSteps.value.flatMap((section) =>
		section.items
			.map((item) => {
				const quantityForItem = quantity(item.key);
				return {
					key: item.key,
					productId: item.productId,
					name: item.name,
					quantity: quantityForItem,
					price: Math.round(item.price * 100) / 100,
					lineTotal:
						(Math.round(item.price * 100) / 100) * quantityForItem,
				};
			})
			.filter((line) => line.quantity > 0),
	),
);

const reviewTotal = computed(() =>
	selectedLines.value.reduce((total, line) => total + line.lineTotal, 0),
);

const canLeaveStep = computed(() => {
	if (currentStepKey.value !== 'details') return true;
	return (
		firstName.value.trim().length > 0 &&
		lastName.value.trim().length > 0 &&
		helperChoice.value !== ''
	);
});

const confirmed = ref(false);
const isSubmitting = ref(false);
const submitError = ref('');
const submitted = ref<{
	firstName: string;
	lastName: string;
	items: OrderLine[];
} | null>(null);
const submissionAttempt = ref<{ signature: string; token: string } | null>(
	null,
);
// Set when a submit attempt failed so a later, *edited* order can be flagged.
const lastFailedSignature = ref<string | null>(null);
// Shows on the review step once a failed attempt exists and the order has
// been edited since: the failed attempt may still have completed server-side
// even though the client saw an error, and a changed signature means
// idempotency no longer covers the retry.
const duplicateOrderHint = computed(
	() =>
		lastFailedSignature.value !== null &&
		currentOrderSignature.value !== lastFailedSignature.value,
);

const currentOrderSignature = computed(() =>
	JSON.stringify({
		firstName: firstName.value.trim(),
		lastName: lastName.value.trim(),
		isHelper: isHelper.value,
		items: selectedLines.value
			.map((line) => ({
				productId: line.productId,
				quantity: line.quantity,
			}))
			.sort((a, b) =>
				String(a.productId).localeCompare(String(b.productId)),
			),
	}),
);

// Per-device identifier for the public rate limit on submit. Storage is used
// when available; in private-mode browsers where storage is consistently
// blocked, one identifier is kept in memory for the whole page visit instead
// of regenerating per submission. Never treated as an identity.
const CLIENT_ID_STORAGE_KEY = 'otaku-preorder-client-id';
let memoizedClientId: string | null = null;
function readClientId(): string {
	if (memoizedClientId) return memoizedClientId;
	let clientId: string | null = null;
	try {
		clientId = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
	} catch {
		// Storage unavailable; fall through to generating an identifier.
	}
	if (!clientId) {
		clientId = createRequestId();
		try {
			window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
		} catch {
			// Storage unavailable; the identifier stays in memory only.
		}
	}
	memoizedClientId = clientId;
	return clientId;
}

const canSubmit = computed(
	() =>
		currentStepKey.value === 'review' &&
		selectedLines.value.length > 0 &&
		firstName.value.trim().length > 0 &&
		lastName.value.trim().length > 0 &&
		helperChoice.value !== '' &&
		confirmed.value &&
		!isSubmitting.value,
);

function goBack() {
	if (isSubmitting.value || stepIndex.value <= 0) return;
	stepIndex.value -= 1;
}

function goNext() {
	if (isSubmitting.value || !canLeaveStep.value) return;
	stepIndex.value = Math.min(stepIndex.value + 1, steps.value.length - 1);
}

const { mutate: submitOrder } = useConvexMutation(api.preorders.submit);

async function submitPreorder() {
	if (!canSubmit.value) return;
	isSubmitting.value = true;
	submitError.value = '';
	const signature = currentOrderSignature.value;
	if (submissionAttempt.value?.signature !== signature) {
		submissionAttempt.value = {
			signature,
			token: createRequestId(),
		};
	}
	lastFailedSignature.value = null;
	try {
		const firstNameValue = firstName.value.trim();
		const lastNameValue = lastName.value.trim();
		const orderItems = selectedLines.value.map((line) => ({
			productId: line.productId,
			quantity: line.quantity,
		}));
		await submitOrder({
			slug: slug.value,
			submissionToken: submissionAttempt.value.token,
			clientId: readClientId(),
			firstName: firstNameValue,
			lastName: lastNameValue,
			isHelper: isHelper.value,
			confirmed: confirmed.value,
			items: orderItems,
		});
		submitted.value = {
			firstName: firstNameValue,
			lastName: lastNameValue,
			items: [...selectedLines.value],
		};
		nextTick(() => stateHeading.value?.focus());
	} catch (error) {
		submitError.value =
			error instanceof Error
				? error.message
				: 'Submitting failed. Please review your order and try again.';
		lastFailedSignature.value = signature;
	} finally {
		isSubmitting.value = false;
	}
}

function startNewOrder() {
	submitted.value = null;
	submissionAttempt.value = null;
	submitError.value = '';
	lastFailedSignature.value = null;
	firstName.value = '';
	lastName.value = '';
	helperChoice.value = '';
	confirmed.value = false;
	// Reset quantities instead of deleting keys (no dynamic deletes).
	for (const key of Object.keys(quantities)) {
		quantities[key] = 0;
	}
	stepIndex.value = 0;
}

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(
		amount,
	);

const formatDate = (timestamp: number) =>
	new Intl.DateTimeFormat('en', {
		dateStyle: 'full',
		timeZone: 'Europe/Berlin',
	}).format(timestamp);

const formatDateTime = (timestamp: number) =>
	new Intl.DateTimeFormat('en', {
		dateStyle: 'full',
		timeStyle: 'short',
		timeZone: 'Europe/Berlin',
	}).format(timestamp);

useHead({
	title: computed(() =>
		preorderForm.value?.name
			? `${preorderForm.value.name} — Preorder`
			: 'Preorder',
	),
	meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
</script>
