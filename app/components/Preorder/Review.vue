<template>
	<UCard>
		<template #header>
			<div class="flex items-center justify-between gap-3">
				<h2 class="text-xl font-semibold">
					Preorders — {{ formName }}
				</h2>
				<UButton
					color="neutral"
					variant="ghost"
					icon="i-lucide-x"
					aria-label="Close preorder review"
					@click="emit('close')"
				/>
			</div>
		</template>
		<div class="grid gap-8 lg:grid-cols-2">
			<section>
				<h3 class="mb-3 font-semibold">Preparation totals</h3>
				<p
					v-if="
						preparationTotals?.length &&
						!preparationPending &&
						!preparationError
					"
					class="mb-3 text-sm text-muted"
				>
					Supply cost total:
					<strong v-if="allSupplyCostsKnown">{{
						formatCurrency(totalSupplyCost)
					}}</strong>
					<strong v-else
						>Incomplete — {{ formatCurrency(knownSupplyCost) }} for
						items with known costs</strong
					>
				</p>
				<div
					v-if="preparationPending"
					class="text-sm text-muted"
				>
					Loading quantities…
				</div>
				<div
					v-else-if="preparationError"
					class="space-y-2"
				>
					<UAlert
						title="Preparation totals could not be loaded"
						description="Retry to load quantities for this form."
						color="error"
						icon="i-lucide-circle-alert"
					/>
					<UButton
						variant="outline"
						:loading="preparationRetrying"
						@click="retryPreparationTotals"
						>Retry preparation totals</UButton
					>
				</div>
				<p
					v-else-if="!preparationTotals?.length"
					class="text-sm text-muted"
				>
					No items are configured for this form.
				</p>
				<ul
					v-else
					class="divide-y rounded-lg border"
				>
					<li
						v-for="item in preparationTotals"
						:key="item.productId"
						class="flex items-center justify-between gap-3 px-4 py-3"
					>
						<div class="min-w-0">
							<p>{{ item.productName }}</p>
							<p class="text-sm text-muted">
								<span v-if="item.unitSupplyCost !== null">
									{{ formatCurrency(item.unitSupplyCost) }}
									each ·
									{{
										formatCurrency(
											item.totalSupplyCost ?? 0,
										)
									}}
									total
								</span>
								<span v-else>Supply cost unknown</span>
							</p>
						</div>
						<UBadge
							color="primary"
							variant="subtle"
							>{{ item.totalQuantity }}</UBadge
						>
					</li>
				</ul>
			</section>
			<section>
				<h3 class="mb-3 font-semibold">Submitted orders</h3>
				<div
					v-if="submissionsPending"
					class="text-sm text-muted"
				>
					Loading orders…
				</div>
				<div
					v-else-if="submissionsError && !submissions?.length"
					class="space-y-2"
				>
					<UAlert
						title="Submitted orders could not be loaded"
						description="Retry to load the preorder submissions for this form."
						color="error"
						icon="i-lucide-circle-alert"
					/>
					<UButton
						variant="outline"
						:disabled="submissionsPending"
						@click="resetSubmissionsQuery"
						>Retry submitted orders</UButton
					>
				</div>
				<p
					v-else-if="!submissions?.length"
					class="text-sm text-muted"
				>
					No preorders have been submitted yet.
				</p>
				<div
					v-else
					class="space-y-3"
				>
					<UCard
						v-for="submission in submissions"
						:key="submission._id"
						variant="subtle"
					>
						<div
							class="flex flex-wrap items-start justify-between gap-2"
						>
							<div>
								<p class="font-medium">
									{{ submission.firstName }}
									{{ submission.lastName }}
								</p>
								<p class="text-sm text-muted">
									Helper (self-declared):
									{{ submission.isHelper ? 'Yes' : 'No' }}
								</p>
							</div>
							<div class="flex items-start gap-2">
								<UButton
									color="error"
									icon="i-lucide-trash-2"
									size="xs"
									variant="ghost"
									class="shrink-0"
									:aria-label="
										'Remove the order from ' +
										submission.firstName +
										' ' +
										submission.lastName
									"
									:disabled="pendingRemovalId !== null"
									@click="
										requestSubmissionRemoval(submission)
									"
									>Remove</UButton
								>
								<time class="text-xs text-muted">{{
									formatDateTime(submission._creationTime)
								}}</time>
							</div>
						</div>
						<ul class="mt-3 space-y-1 text-sm">
							<li
								v-for="item in submission.items"
								:key="item._id"
							>
								{{ item.productName }} × {{ item.quantity }}
							</li>
						</ul>
					</UCard>
				</div>
				<div
					v-if="submissionsError && submissions?.length"
					class="mt-3 space-y-2"
				>
					<UAlert
						title="Additional orders could not be loaded"
						description="An error occurred while loading more orders. The orders already loaded are kept."
						color="error"
						icon="i-lucide-circle-alert"
					/>
					<UButton
						variant="outline"
						:loading="loadingMoreSubmissions"
						:disabled="loadingMoreSubmissions"
						@click="loadMoreSubmissions"
						>Retry loading more orders</UButton
					>
				</div>
				<div
					v-if="
						!submissionsDone &&
						!submissionsPending &&
						!submissionsError
					"
					class="mt-3"
				>
					<UButton
						variant="outline"
						:loading="loadingMoreSubmissions"
						:disabled="loadingMoreSubmissions"
						@click="loadMoreSubmissions"
						>Load more orders</UButton
					>
				</div>
			</section>
		</div>
	</UCard>

	<UModal
		:open="submissionToRemove !== null"
		title="Remove preorder"
		@update:open="
			(open: boolean) => {
				if (!open && pendingRemovalId === null)
					submissionToRemove = null;
			}
		"
	>
		<template #description>
			<div class="space-y-2">
				<p>
					This permanently removes the preorder from
					<span class="font-medium"
						>{{ submissionToRemove?.firstName }}
						{{ submissionToRemove?.lastName }}</span
					>
					({{ quantityLabel(removalTargetQuantity) }}). Preparation
					totals are reduced accordingly:
				</p>
				<ul class="list-disc pl-5">
					<li
						v-for="item in submissionToRemove?.items"
						:key="item._id"
					>
						{{ item.productName }} × {{ item.quantity }}
					</li>
				</ul>
				<p>This cannot be undone.</p>
			</div>
		</template>
		<template #body>
			<UAlert
				v-if="removalError"
				title="Could not remove the preorder"
				:description="
					removalError instanceof Error
						? removalError.message
						: 'Please try again.'
				"
				color="error"
				icon="i-lucide-circle-alert"
			/>
		</template>
		<template #footer>
			<div class="flex flex-wrap justify-end gap-2">
				<UButton
					color="neutral"
					label="Cancel"
					:disabled="pendingRemovalId !== null"
					@click="submissionToRemove = null"
				/>
				<UButton
					color="error"
					:loading="pendingRemovalId !== null"
					:disabled="pendingRemovalId !== null"
					label="Remove preorder"
					@click="confirmSubmissionRemoval"
				/>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
import { api } from '#convex/api';
import type { Id } from '~~/convex/_generated/dataModel';

const props = defineProps<{
	formId: Id<'preorderForms'>;
	formName?: string;
}>();
const emit = defineEmits<{ close: [] }>();
const toast = useToast();
const currencyFormatter = new Intl.NumberFormat('en-IE', {
	style: 'currency',
	currency: 'EUR',
});
const allSupplyCostsKnown = computed(
	() =>
		preparationTotals.value?.every(
			(item) => item.totalSupplyCost !== null,
		) ?? false,
);
const knownSupplyCost = computed(
	() =>
		preparationTotals.value?.reduce(
			(sum, item) => sum + (item.totalSupplyCost ?? 0),
			0,
		) ?? 0,
);
const totalSupplyCost = computed(() => knownSupplyCost.value);
function formatCurrency(value: number) {
	return currencyFormatter.format(value);
}

const reviewArgs = computed(() => ({ formId: props.formId }));
// Changing this tick changes the args object identity to re-subscribe the
// plain query while keeping the backend args limited to the selected form ID.
const preparationRetryTick = ref(0);
const preparationRetrying = ref(false);
const preparationArgs = computed(() => {
	void preparationRetryTick.value;
	return { formId: props.formId };
});
function retryPreparationTotals() {
	preparationRetrying.value = true;
	preparationRetryTick.value++;
}

const {
	data: submissions,
	isPending: submissionsPending,
	isDone: submissionsDone,
	isLoadingMore: loadingMoreSubmissions,
	loadMore: loadMoreSubmissions,
	error: submissionsError,
	reset: resetSubmissionsQuery,
} = useConvexPaginatedQuery(api.preorders.listSubmissions, reviewArgs, {
	numItems: 25,
});
const {
	data: preparationTotals,
	isPending: preparationPending,
	error: preparationError,
} = useConvexQuery(api.preorders.preparationTotals, preparationArgs, {
	server: false,
});
watch([preparationTotals, preparationError, () => props.formId], () => {
	preparationRetrying.value = false;
});

type ReviewSubmission = {
	_id: Id<'preorderSubmissions'>;
	_creationTime: number;
	firstName: string;
	lastName: string;
	isHelper: boolean;
	items: {
		_id: Id<'preorderSubmissionItems'>;
		productName: string;
		quantity: number;
	}[];
};
function quantityLabel(count: number) {
	return `${count} ${count === 1 ? 'item' : 'items'}`;
}
const submissionToRemove = ref<ReviewSubmission | null>(null);
function submissionTotalQuantity(submission: ReviewSubmission) {
	return submission.items.reduce((total, item) => total + item.quantity, 0);
}
const removalTargetQuantity = computed(() =>
	submissionToRemove.value
		? submissionTotalQuantity(submissionToRemove.value)
		: 0,
);
const pendingRemovalId = ref<Id<'preorderSubmissions'> | null>(null);
const { mutate: removeSubmission, error: removalError } = useConvexMutation(
	api.preorders.removeSubmission,
);
function requestSubmissionRemoval(submission: ReviewSubmission) {
	removalError.value = null;
	submissionToRemove.value = submission;
}
async function confirmSubmissionRemoval() {
	const submission = submissionToRemove.value;
	if (!submission || pendingRemovalId.value !== null) return;
	pendingRemovalId.value = submission._id;
	removalError.value = null;
	try {
		await removeSubmission({ submissionId: submission._id });
		submissionToRemove.value = null;
		toast.add({
			title: 'Preorder removed',
			description: `Removed ${submission.firstName} ${submission.lastName} (${quantityLabel(submissionTotalQuantity(submission))}) from ${props.formName ?? 'the form'}.`,
			color: 'success',
		});
	} catch {
		// Keep the confirmation open so the operator can retry.
	} finally {
		pendingRemovalId.value = null;
	}
}

const formatDateTime = (timestamp: number) =>
	new Intl.DateTimeFormat('en', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'Europe/Berlin',
	}).format(timestamp);
</script>
