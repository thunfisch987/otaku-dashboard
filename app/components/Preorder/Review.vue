<template>
	<UCard>
		<template #header>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 class="text-xl font-semibold">
					Preorders — {{ formName }}
				</h2>
				<div class="flex flex-wrap items-center justify-end gap-2">
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-download"
						class="min-h-11"
						:disabled="exporting !== null || !canExportTotals"
						@click="downloadTotalsCsv"
						>Download totals CSV</UButton
					>
					<UButton
						color="neutral"
						variant="outline"
						icon="i-lucide-download"
						class="min-h-11"
						:loading="exporting === 'orders'"
						:disabled="exporting !== null || !canExportOrders"
						@click="downloadOrdersCsv"
						>Download orders CSV</UButton
					>
					<UButton
						color="neutral"
						variant="ghost"
						icon="i-lucide-x"
						aria-label="Close preorder review"
						@click="emit('close')"
					/>
				</div>
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
						description="An error occurred while loading more orders. The orders already loaded are kept; reloading starts again from the first page."
						color="error"
						icon="i-lucide-circle-alert"
					/>
					<UButton
						variant="outline"
						:disabled="loadingMoreSubmissions"
						@click="() => resetSubmissionsQuery()"
						>Reload orders from the first page</UButton
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
						@click="() => loadMoreSubmissions()"
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
import { formatCurrency } from '~/utils/currency';

const props = defineProps<{
	formId: Id<'preorderForms'>;
	formName?: string;
}>();
const emit = defineEmits<{ close: [] }>();
const toast = useToast();
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

const SUBMISSIONS_PAGE_SIZE = 25;
const SUBMISSIONS_PAGE_TIMEOUT_MS = 20_000;
const SUBMISSIONS_PAGE_RETRIES = 2;
const exporting = ref<'totals' | 'orders' | null>(null);

// The orders export waits on paginated query updates, so it can be in flight
// when the panel closes or the operator selects another form. Cancellation
// rejects that wait instead of leaving its timeout to restart the retry loop.
type ExportCancellation = 'unmounted' | 'form-changed';
class ExportCancelledError extends Error {
	constructor(readonly reason: ExportCancellation) {
		super('Orders export cancelled');
	}
}
// Watchers started from the export button live outside the setup effect
// scope, so they are stopped explicitly when the panel unmounts.
const pendingStops = new Set<() => void>();
let cancelPendingPageWait: ((reason: ExportCancellation) => void) | null = null;
// The unmount hook may run between a page wait settling and the export
// continuing; `props.formId` does not change then, so track unmount itself.
let panelUnmounted = false;
onBeforeUnmount(() => {
	panelUnmounted = true;
	for (const stop of pendingStops) stop();
	pendingStops.clear();
	cancelPendingPageWait?.('unmounted');
});
// A form switch re-subscribes the paginated query; stop waiting on the old
// form immediately so its export cannot continue against the new pages.
watch(
	() => props.formId,
	() => cancelPendingPageWait?.('form-changed'),
);
const canExportTotals = computed(
	() =>
		!preparationPending.value &&
		!preparationError.value &&
		(preparationTotals.value?.length ?? 0) > 0,
);
const canExportOrders = computed(
	() =>
		!submissionsPending.value &&
		!submissionsError.value &&
		(submissions.value?.length ?? 0) > 0,
);

function csvCell(value: string | number) {
	let text = String(value);
	if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
	return `"${text.replaceAll('"', '""')}"`;
}

function formatDateInput(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

const csvDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23',
	timeZone: 'Europe/Berlin',
});
function formatCsvDateTime(timestamp: number) {
	const parts = new Map(
		csvDateTimeFormatter
			.formatToParts(timestamp)
			.map((entry) => [entry.type, entry.value]),
	);
	return `${parts.get('year')}-${parts.get('month')}-${parts.get('day')} ${parts.get('hour')}:${parts.get('minute')}`;
}

function exportFileBase() {
	const name = (props.formName ?? 'form')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40)
		.replace(/-+$/g, '');
	return `preorder-${name || 'form'}-${formatDateInput(new Date())}`;
}

function downloadCsv(csv: string, filename: string) {
	const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadTotalsCsv() {
	if (exporting.value !== null || !canExportTotals.value) return;
	const totals = preparationTotals.value ?? [];
	exporting.value = 'totals';
	try {
		const headers = [
			'Section',
			'Product',
			'Ordered quantity',
			'Unit supply cost',
			'Total supply cost',
		];
		const rows = totals.map((item) => [
			item.section.charAt(0).toUpperCase() + item.section.slice(1),
			item.productName,
			item.totalQuantity,
			item.unitSupplyCost === null
				? 'Unknown'
				: formatCurrency(item.unitSupplyCost),
			item.totalSupplyCost === null
				? 'Unknown'
				: formatCurrency(item.totalSupplyCost),
		]);
		const csv = [
			headers.map(csvCell).join(','),
			...rows.map((row) => row.map(csvCell).join(',')),
		].join('\r\n');
		downloadCsv(csv, `${exportFileBase()}-totals.csv`);
	} finally {
		exporting.value = null;
	}
}

function submissionsSettled(previousCount: number) {
	return () =>
		submissionsDone.value ||
		submissionsError.value !== null ||
		(submissions.value?.length ?? 0) !== previousCount;
}

function waitForNextSubmissionsPage(previousCount: number) {
	return new Promise<void>((resolve, reject) => {
		const settled = submissionsSettled(previousCount);
		if (settled()) {
			resolve();
			return;
		}
		const timeout: { handle?: ReturnType<typeof setTimeout> } = {};
		function finish() {
			stop();
			pendingStops.delete(stop);
			if (timeout.handle) clearTimeout(timeout.handle);
			cancelPendingPageWait = null;
		}
		const stop = watch(
			[submissions, submissionsDone, submissionsError],
			() => {
				if (!settled()) return;
				finish();
				resolve();
			},
		);
		pendingStops.add(stop);
		cancelPendingPageWait = (reason) => {
			finish();
			reject(new ExportCancelledError(reason));
		};
		timeout.handle = setTimeout(() => {
			finish();
			reject(
				new Error(
					'Orders stopped loading before every submission was available.',
				),
			);
		}, SUBMISSIONS_PAGE_TIMEOUT_MS);
	});
}

async function loadAllSubmissions(expectedFormId: Id<'preorderForms'>) {
	let retries = 0;
	while (!submissionsDone.value) {
		if (panelUnmounted) throw new ExportCancelledError('unmounted');
		if (props.formId !== expectedFormId) {
			throw new ExportCancelledError('form-changed');
		}
		if (submissionsError.value) throw submissionsError.value;
		const before = submissions.value?.length ?? 0;
		const nextPage = waitForNextSubmissionsPage(before);
		// vue-convex returns false when the query is done, has an error, or a
		// page is already in flight; the awaited settle promise covers the
		// in-flight case, so the return value needs no separate handling.
		loadMoreSubmissions(SUBMISSIONS_PAGE_SIZE);
		try {
			await nextPage;
			retries = 0;
		} catch (error) {
			// Cancellation ends the export at once, even with retries left.
			if (error instanceof ExportCancelledError) throw error;
			// A page that stalls can be a transient subscription gap (for
			// example, an order removed mid-export changed the page size).
			// Retry a bounded number of times before giving up.
			if (retries >= SUBMISSIONS_PAGE_RETRIES) throw error;
			retries += 1;
		}
	}
	if (panelUnmounted) throw new ExportCancelledError('unmounted');
	if (props.formId !== expectedFormId) {
		throw new ExportCancelledError('form-changed');
	}
	if (submissionsError.value) throw submissionsError.value;
}

async function downloadOrdersCsv() {
	if (exporting.value !== null || !canExportOrders.value) return;
	exporting.value = 'orders';
	// Pin the export to the form it started on: selecting another form while
	// the pages load must not write this form's orders into a file.
	const exportFormId = props.formId;
	try {
		// Export the complete form, not just the pages already rendered.
		await loadAllSubmissions(exportFormId);
		if (panelUnmounted) throw new ExportCancelledError('unmounted');
		if (props.formId !== exportFormId) {
			throw new ExportCancelledError('form-changed');
		}
		const orders = submissions.value ?? [];
		const headers = [
			'Order time',
			'First name',
			'Last name',
			'Helper',
			'Product',
			'Quantity',
			'Items in order',
		];
		const rows = orders.flatMap((submission) => {
			const itemsInOrder = submissionTotalQuantity(submission);
			const helper = submission.isHelper ? 'Yes' : 'No';
			const orderTime = formatCsvDateTime(submission._creationTime);
			return submission.items.map((item) => [
				orderTime,
				submission.firstName,
				submission.lastName,
				helper,
				item.productName,
				item.quantity,
				itemsInOrder,
			]);
		});
		if (!rows.length) {
			toast.add({
				title: 'No ordered items to export',
				description:
					'This form has no submitted order lines. Preparation totals export is still available.',
				color: 'error',
			});
			return;
		}
		const csv = [
			headers.map(csvCell).join(','),
			...rows.map((row) => row.map(csvCell).join(',')),
		].join('\r\n');
		downloadCsv(csv, `${exportFileBase()}-orders.csv`);
	} catch (error) {
		if (error instanceof ExportCancelledError) {
			// Closing the panel needs no feedback. A form switch does: the
			// operator never got a file and must retry on the current form.
			if (error.reason === 'form-changed') {
				toast.add({
					title: 'Orders export cancelled',
					description:
						'The selected form changed before the export finished. Start the export again for the current form.',
					color: 'warning',
				});
			}
			return;
		}
		toast.add({
			title: 'Could not export orders',
			description:
				error instanceof Error
					? error.message
					: 'Check your connection and retry the export.',
			color: 'error',
		});
	} finally {
		exporting.value = null;
	}
}
</script>
