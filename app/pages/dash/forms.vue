<template>
	<main class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
		<header>
			<h1 class="text-3xl font-semibold">Preorder forms</h1>
			<p class="mt-2 text-gray-500">
				Create event menus, share a public preorder link, and review
				preparation totals.
			</p>
		</header>

		<UAlert
			v-if="pageError"
			:title="pageError.title"
			:description="pageError.message"
			color="error"
			icon="i-lucide-circle-alert"
		/>
		<div
			v-if="productsError"
			class="space-y-2"
		>
			<UAlert
				title="Inventory products could not be loaded"
				description="Retry to load the inventory items available for this form."
				color="error"
				icon="i-lucide-circle-alert"
			/>
			<UButton
				variant="outline"
				:disabled="productsPending"
				@click="resetProductsQuery"
				>Retry inventory loading</UButton
			>
		</div>

		<UCard>
			<template #header
				><h2 class="text-xl font-semibold">
					Create a preorder form
				</h2></template
			>
			<UForm
				:state="formState"
				class="space-y-5"
				@submit="saveForm"
			>
				<div class="grid gap-4 md:grid-cols-3">
					<UFormField
						label="Form name"
						name="name"
						required
					>
						<UInput
							v-model="formState.name"
							class="w-full"
							maxlength="120"
							placeholder="Spring event preorder"
							size="lg"
						/>
					</UFormField>
					<UFormField
						label="Event date"
						name="eventDate"
						required
					>
						<DatePicker v-model:calendar-model="eventDate" />
					</UFormField>
					<UFormField label="Close date and time (optional)">
						<div class="flex flex-wrap gap-2">
							<DatePicker v-model:calendar-model="closeDate" />
							<UInput
								v-model="formState.closeTime"
								aria-label="Close time"
								type="time"
								size="lg"
							/>
						</div>
					</UFormField>
				</div>

				<div class="flex flex-wrap gap-x-8 gap-y-3">
					<UCheckbox
						v-model="formState.includeFood"
						label="Include food step"
					/>
					<UCheckbox
						v-model="formState.includeSnacks"
						label="Include snacks step"
					/>
					<UCheckbox
						v-model="formState.isActive"
						label="Activate after creating"
					/>
				</div>

				<UCard variant="subtle">
					<div class="space-y-5">
						<section
							v-for="section in sections"
							v-show="
								section.key === 'onigiri' || section.enabled
							"
							:key="section.key"
							class="space-y-2"
						>
							<div>
								<h3 class="font-semibold">
									{{ section.label }}
								</h3>
								<p
									v-if="section.key === 'onigiri'"
									class="text-sm text-gray-500"
								>
									Onigiri is always included. Add at least one
									product categorized as Onigiri.
								</p>
								<p
									v-else
									class="text-sm text-gray-500"
								>
									Only products categorized as
									{{ section.label }} appear here.
								</p>
							</div>
							<div
								v-if="itemsFor(section.key).length"
								class="flex flex-wrap gap-2"
							>
								<UBadge
									v-for="item in itemsFor(section.key)"
									:key="item.productId"
									color="primary"
									variant="subtle"
									class="gap-2 py-1.5"
								>
									{{ item.productname }} ·
									{{ formatCurrency(item.price) }}
									<UButton
										size="xs"
										color="neutral"
										variant="ghost"
										icon="i-lucide-x"
										:aria-label="
											'Remove ' + item.productname
										"
										@click="removeItem(item.productId)"
									/>
								</UBadge>
							</div>
							<div class="flex flex-col gap-2 sm:flex-row">
								<USelectMenu
									v-model="selectedProduct[section.key]"
									:items="productsFor(section.key)"
									:loading="productsPending"
									label-key="productname"
									value-key="_id"
									placeholder="Choose an inventory product"
									class="min-w-64 flex-1"
									size="lg"
								/>
								<UButton
									class="min-h-11"
									:disabled="!selectedProduct[section.key]"
									@click="addItem(section.key)"
									>Add
									{{ section.label.toLowerCase() }}
									item</UButton
								>
							</div>
						</section>
					</div>
					<div
						v-if="!productsDone"
						class="flex justify-center"
					>
						<UButton
							variant="outline"
							:loading="productsLoadingMore"
							:disabled="productsLoadingMore"
							@click="loadMoreProducts"
							>Load more inventory products</UButton
						>
					</div>
				</UCard>

				<UCard
					variant="subtle"
					class="border-dashed"
				>
					<template #header>
						<div>
							<h3 class="font-semibold">
								Create an inventory product
							</h3>
							<p class="text-sm text-gray-500">
								Choose a menu category to add the product
								directly to that preorder section.
							</p>
						</div>
					</template>
					<div class="grid gap-3 md:grid-cols-6">
						<UFormField
							label="Product name"
							class="md:col-span-2"
							><UInput
								v-model="newProduct.productname"
								class="w-full"
								placeholder="Product name"
						/></UFormField>
						<UFormField label="Category">
							<USelect
								v-model="newProduct.category"
								:items="productCategories"
							/>
						</UFormField>
						<UFormField label="Regular price (€)"
							><UInput
								v-model="newProduct.price"
								type="number"
								min="0"
								step="0.01"
								:disabled="
									newProduct.category === 'onigiri' &&
									!!onigiriPricing
								"
						/></UFormField>
						<UFormField label="Supplier"
							><USelect
								v-model="newProduct.supplier"
								:items="supplierOptions"
						/></UFormField>
						<UFormField label="Initial stock"
							><UInputNumber
								v-model="newProduct.amount"
								:min="0"
						/></UFormField>
					</div>
					<div
						class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
					>
						<UFormField
							label="Helper price (€)"
							hint="Optional; used only for helper checkouts in the POS."
							class="w-full sm:max-w-xs"
						>
							<UInput
								v-model="newProduct.helperPrice"
								type="number"
								min="0"
								step="0.01"
								placeholder="Leave empty for regular price"
								:disabled="
									newProduct.category === 'onigiri' &&
									!!onigiriPricing
								"
							/>
						</UFormField>
						<p
							v-if="newProduct.category === 'onigiri'"
							class="text-sm text-muted sm:self-center"
						>
							{{
								onigiriPricing
									? 'Uses shared Onigiri prices.'
									: 'Initializes shared Onigiri prices.'
							}}
						</p>
						<UButton
							class="min-h-11"
							:loading="createProductPending"
							:disabled="
								!newProduct.productname.trim() ||
								createProductPending
							"
							@click="createInventoryProduct"
							>Create product</UButton
						>
					</div>
				</UCard>

				<div class="flex flex-wrap gap-3">
					<UButton
						type="submit"
						size="lg"
						:loading="savePending"
						:disabled="!canSave || savePending"
						>Save form</UButton
					>
					<UButton
						color="neutral"
						variant="outline"
						size="lg"
						@click="resetForm"
						>Reset</UButton
					>
				</div>
			</UForm>
		</UCard>

		<UCard>
			<template #header
				><h2 class="text-xl font-semibold">Created forms</h2></template
			>
			<div
				v-if="formsPending"
				class="py-4 text-center text-gray-500"
			>
				Loading forms…
			</div>
			<div
				v-else-if="formsError"
				class="space-y-2"
			>
				<UAlert
					title="Forms could not be loaded"
					description="Retry to load created forms."
					color="error"
					icon="i-lucide-circle-alert"
				/>
				<UButton
					variant="outline"
					:disabled="formsPending"
					@click="resetFormsQuery"
					>Retry forms</UButton
				>
			</div>
			<p
				v-else-if="!forms?.length"
				class="py-4 text-gray-500"
			>
				No preorder forms have been created yet.
			</p>
			<div
				v-else
				class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
			>
				<UCard
					v-for="form in forms"
					:key="form._id"
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<h3 class="text-lg font-semibold">
								{{ form.name }}
							</h3>
							<UBadge
								:color="
									formStatus(form) === 'Open'
										? 'success'
										: formStatus(form) === 'Closed'
											? 'warning'
											: 'neutral'
								"
								variant="subtle"
								class="mt-1"
							>
								{{ formStatus(form) }}
							</UBadge>
							<p class="text-sm text-gray-500">
								Event: {{ formatDate(form.eventDate) }}
							</p>
							<p class="text-sm text-gray-500">
								{{
									form.closeAt === null
										? 'No closing time'
										: 'Closes ' +
											formatDateTime(form.closeAt)
								}}
							</p>
						</div>
						<UCheckbox
							:model-value="form.isActive"
							:disabled="pendingActivationId === form._id"
							:label="form.isActive ? 'Enabled' : 'Disabled'"
							@update:model-value="
								toggleForm(form._id, $event === true)
							"
						/>
					</div>
					<div class="mt-3 flex flex-wrap gap-2">
						<UBadge
							color="primary"
							variant="subtle"
							>Onigiri</UBadge
						>
						<UBadge
							v-if="form.includeFood"
							color="warning"
							variant="subtle"
							>Food</UBadge
						>
						<UBadge
							v-if="form.includeSnacks"
							color="success"
							variant="subtle"
							>Snacks</UBadge
						>
					</div>
					<div class="mt-4 flex flex-wrap gap-2">
						<UButton
							class="min-h-11"
							variant="soft"
							@click="copyFormLink(form.slug, formStatus(form))"
							>Copy public link</UButton
						>
						<UButton
							class="min-h-11"
							color="neutral"
							variant="outline"
							@click="selectForm(form._id)"
							>View preparation</UButton
						>
					</div>
				</UCard>
			</div>
			<div
				v-if="!formsDone"
				class="mt-4 flex justify-center"
			>
				<UButton
					variant="outline"
					:loading="formsLoadingMore"
					:disabled="formsLoadingMore"
					@click="loadMoreForms"
					>Load older forms</UButton
				>
			</div>
		</UCard>

		<UCard v-if="selectedFormId">
			<template #header>
				<div class="flex items-center justify-between gap-3">
					<h2 class="text-xl font-semibold">
						Preorders — {{ selectedForm?.name }}
					</h2>
					<UButton
						color="neutral"
						variant="ghost"
						icon="i-lucide-x"
						aria-label="Close preorder review"
						@click="selectedFormId = null"
					/>
				</div>
			</template>
			<div class="grid gap-8 lg:grid-cols-2">
				<section>
					<h3 class="mb-3 font-semibold">Preparation totals</h3>
					<div
						v-if="preparationPending"
						class="text-sm text-gray-500"
					>
						Loading quantities…
					</div>
					<p
						v-else-if="!preparationTotals?.length"
						class="text-sm text-gray-500"
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
							<span>{{ item.productName }}</span>
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
						class="text-sm text-gray-500"
					>
						Loading orders…
					</div>
					<p
						v-else-if="!submissions?.length"
						class="text-sm text-gray-500"
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
									<p class="text-sm text-gray-500">
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
									<time class="text-xs text-gray-500">{{
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
						v-if="!submissionsDone"
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
			:ui="{ footer: 'justify-end' }"
			@update:open="
				(open: boolean) => {
					if (!open) submissionToRemove = null;
				}
			"
		>
			<template #description>
				<span>
					This permanently removes the preorder from
					<span class="font-medium"
						>{{ submissionToRemove?.firstName }}
						{{ submissionToRemove?.lastName }}</span
					>
					({{ removalTargetQuantity }}
					items). Preparation totals are reduced accordingly. This
					cannot be undone.
				</span>
			</template>
			<template #footer>
				<div class="flex flex-wrap justify-end gap-2">
					<UButton
						color="neutral"
						label="Cancel"
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
		</UModal>
	</main>
</template>

<script setup lang="ts">
import { api } from '#convex/api';
import type { Id } from '~~/convex/_generated/dataModel';
import { CalendarDateTime, type CalendarDate } from '@internationalized/date';
import {
	productCategories,
	type ProductCategory,
} from '~/components/Inventory/types';

type Section = 'food' | 'snacks' | 'onigiri';
type FormProduct = {
	_id: Id<'products'>;
	productname: string;
	price: number;
	amount: number;
	category?: ProductCategory;
};

const formState = reactive({
	name: '',
	closeTime: '18:00',
	includeFood: false,
	includeSnacks: false,
	isActive: false,
	items: [] as { productId: Id<'products'>; section: Section }[],
});
const eventDate = shallowRef<CalendarDate>();
const closeDate = shallowRef<CalendarDate>();
const sections = computed(() => [
	{ key: 'onigiri' as const, label: 'Onigiri', enabled: true },
	{ key: 'food' as const, label: 'Food', enabled: formState.includeFood },
	{
		key: 'snacks' as const,
		label: 'Snacks',
		enabled: formState.includeSnacks,
	},
]);
watch(
	() => formState.includeFood,
	(enabled) => {
		if (!enabled)
			formState.items = formState.items.filter(
				(item) => item.section !== 'food',
			);
	},
);
watch(
	() => formState.includeSnacks,
	(enabled) => {
		if (!enabled)
			formState.items = formState.items.filter(
				(item) => item.section !== 'snacks',
			);
	},
);

const selectedProduct = reactive<Record<Section, Id<'products'> | undefined>>({
	onigiri: undefined,
	food: undefined,
	snacks: undefined,
});
const newProduct = reactive({
	productname: '',
	price: '',
	helperPrice: '',
	category: 'onigiri' as ProductCategory,
	supplier: 'Otaku' as 'HDJ' | 'Otaku',
	amount: 0,
});
const supplierOptions = [
	{ label: 'HDJ', value: 'HDJ' },
	{ label: 'Otaku', value: 'Otaku' },
];
const pageError = ref<{ title: string; message: string } | null>(null);
const toast = useToast();
const runtimeConfig = useRuntimeConfig();

const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } =
	useAppConvexAuth();
const productsQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);
const formsQueryArgs = computed(() =>
	convexAuthLoading.value || !convexAuthenticated.value ? 'skip' : {},
);
const {
	data: products,
	isPending: productsQueryPending,
	isDone: productsDone,
	isLoadingMore: productsLoadingMore,
	loadMore: loadMoreProducts,
	error: productsError,
	reset: resetProductsQuery,
} = useConvexPaginatedQuery(api.products.list, productsQueryArgs, {
	numItems: 200,
});
const { data: onigiriPricing } = useConvexQuery(
	api.products.getOnigiriPricing,
	productsQueryArgs,
	{ server: false },
);
watch(
	() =>
		[
			newProduct.category,
			onigiriPricing.value?.price,
			onigiriPricing.value?.helperPrice,
		] as const,
	([category, sharedPrice, sharedHelperPrice]) => {
		if (category !== 'onigiri' || sharedPrice === undefined) return;
		newProduct.price = String(sharedPrice);
		newProduct.helperPrice =
			sharedHelperPrice === undefined ? '' : String(sharedHelperPrice);
	},
);
const productsPending = computed(
	() =>
		convexAuthLoading.value ||
		!convexAuthenticated.value ||
		productsQueryPending.value,
);
const availableProducts = computed(
	() => (products.value ?? []) as FormProduct[],
);
function productsFor(section: Section) {
	return availableProducts.value.filter(
		(product) =>
			product.category === section &&
			!formState.items.some((item) => item.productId === product._id),
	);
}
function itemsFor(section: Section) {
	return formState.items
		.filter((item) => item.section === section)
		.map((item) => {
			const product = availableProducts.value.find(
				(candidate) => candidate._id === item.productId,
			);
			return {
				...item,
				productname:
					product?.productname ?? 'Product no longer available',
				price: product?.price ?? 0,
			};
		});
}
function addItem(section: Section) {
	const productId = selectedProduct[section];
	if (
		!productId ||
		formState.items.some((item) => item.productId === productId)
	)
		return;
	formState.items.push({ productId, section });
	selectedProduct[section] = undefined;
}
function removeItem(productId: Id<'products'>) {
	formState.items = formState.items.filter(
		(item) => item.productId !== productId,
	);
}

const canSave = computed(
	() =>
		formState.name.trim().length > 0 &&
		!!eventDate.value &&
		formState.items.some((item) => item.section === 'onigiri'),
);
const { mutate: createForm, isPending: savePending } = useConvexMutation(
	api.preorders.createForm,
);
function calendarDateToTimestamp(date: CalendarDate) {
	return new CalendarDateTime(
		date.calendar,
		date.era,
		date.year,
		date.month,
		date.day,
	)
		.toDate('Europe/Berlin')
		.getTime();
}
function calendarDateTimeToTimestamp(
	date: CalendarDate,
	hours: number,
	minutes: number,
) {
	return new CalendarDateTime(
		date.calendar,
		date.era,
		date.year,
		date.month,
		date.day,
		hours,
		minutes,
	)
		.toDate('Europe/Berlin')
		.getTime();
}
async function saveForm() {
	if (!canSave.value || savePending.value || !eventDate.value) return;
	pageError.value = null;
	let closeAt: number | null = null;
	if (closeDate.value) {
		if (!formState.closeTime) {
			pageError.value = {
				title: 'Choose a closing time',
				message:
					'Select a time or clear the closing date to leave the form open.',
			};
			return;
		}
		const [hourText, minuteText] = formState.closeTime.split(':');
		const hours = Number(hourText);
		const minutes = Number(minuteText);
		if (
			!Number.isInteger(hours) ||
			hours < 0 ||
			hours > 23 ||
			!Number.isInteger(minutes) ||
			minutes < 0 ||
			minutes > 59
		) {
			pageError.value = {
				title: 'Choose a valid closing time',
				message: 'Select a valid time in Europe/Berlin.',
			};
			return;
		}
		closeAt = calendarDateTimeToTimestamp(closeDate.value, hours, minutes);
		if (closeAt <= Date.now()) {
			pageError.value = {
				title: 'Choose a future closing time',
				message: 'The closing time must be later than now.',
			};
			return;
		}
	}
	try {
		const isActive = formState.isActive;
		const result = await createForm({
			name: formState.name.trim(),
			eventDate: calendarDateToTimestamp(eventDate.value),
			closeAt,
			includeFood: formState.includeFood,
			includeSnacks: formState.includeSnacks,
			isActive,
			items: formState.items,
		});
		toast.add({
			title: isActive
				? 'Preorder form created'
				: 'Preorder form created inactive',
			description: isActive
				? undefined
				: 'Enable the form before sharing its public link.',
			color: isActive ? 'success' : 'warning',
		});
		resetForm();
		if (isActive) await copyFormLink(result.slug, 'Open');
	} catch (error) {
		pageError.value = {
			title: 'Could not create preorder form',
			message:
				error instanceof Error ? error.message : 'Please try again.',
		};
	}
}
function resetForm() {
	formState.name = '';
	eventDate.value = undefined;
	closeDate.value = undefined;
	formState.closeTime = '18:00';
	formState.includeFood = false;
	formState.includeSnacks = false;
	formState.isActive = false;
	formState.items = [];
	for (const section of Object.keys(selectedProduct) as Section[])
		selectedProduct[section] = undefined;
}

function parseOptionalPrice(value: unknown): number | undefined {
	const input = String(value ?? '').trim();
	if (!input) return undefined;
	const price = Number(input.replace(',', '.'));
	return Number.isFinite(price) && price >= 0 ? price : undefined;
}
const { mutate: createProduct, isPending: createProductPending } =
	useConvexMutation(api.products.create);
async function createInventoryProduct() {
	const productPriceInput = String(newProduct.price ?? '').trim();
	const price = Number(productPriceInput.replace(',', '.'));
	if (
		!newProduct.productname.trim() ||
		!productPriceInput ||
		!Number.isFinite(price) ||
		price < 0
	) {
		pageError.value = {
			title: 'Check the product details',
			message: 'Enter a product name and a valid regular price.',
		};
		return;
	}
	const helperPriceInput = String(newProduct.helperPrice ?? '').trim();
	const helperPrice = parseOptionalPrice(helperPriceInput);
	if (helperPriceInput && helperPrice === undefined) {
		pageError.value = {
			title: 'Check the helper price',
			message:
				'Enter a valid non-negative helper price or leave it empty.',
		};
		return;
	}
	if (helperPrice !== undefined && helperPrice > price) {
		pageError.value = {
			title: 'Check the helper price',
			message:
				'The helper price cannot be higher than the regular price.',
		};
		return;
	}
	pageError.value = null;
	try {
		const createdId = await createProduct({
			productname: newProduct.productname.trim(),
			price,
			category: newProduct.category,
			supplier: newProduct.supplier,
			amount: newProduct.amount,
			...(helperPrice === undefined ? {} : { helperPrice }),
		});
		if (newProduct.category !== 'other') {
			if (newProduct.category === 'food') formState.includeFood = true;
			if (newProduct.category === 'snacks')
				formState.includeSnacks = true;
			formState.items.push({
				productId: createdId,
				section: newProduct.category,
			});
		}
		newProduct.productname = '';
		newProduct.price =
			newProduct.category === 'onigiri' && onigiriPricing.value
				? String(onigiriPricing.value.price)
				: '';
		newProduct.helperPrice =
			newProduct.category === 'onigiri' &&
			onigiriPricing.value?.helperPrice !== undefined
				? String(onigiriPricing.value.helperPrice)
				: '';
		newProduct.amount = 0;
		toast.add({ title: 'Inventory product created', color: 'success' });
	} catch (error) {
		pageError.value = {
			title: 'Could not create product',
			message:
				error instanceof Error ? error.message : 'Please try again.',
		};
	}
}

const {
	data: forms,
	isPending: formsQueryPending,
	isDone: formsDone,
	isLoadingMore: formsLoadingMore,
	loadMore: loadMoreForms,
	error: formsError,
	reset: resetFormsQuery,
} = useConvexPaginatedQuery(api.preorders.listForms, formsQueryArgs, {
	numItems: 20,
});
const formsPending = computed(
	() =>
		convexAuthLoading.value ||
		!convexAuthenticated.value ||
		formsQueryPending.value,
);
const selectedFormId = ref<Id<'preorderForms'> | null>(null);
const selectedForm = computed(() =>
	(forms.value ?? []).find(
		(form: { _id: Id<'preorderForms'> }) =>
			form._id === selectedFormId.value,
	),
);
const pendingActivationId = ref<Id<'preorderForms'> | null>(null);
const { mutate: setActive } = useConvexMutation(api.preorders.setActive);
async function toggleForm(formId: Id<'preorderForms'>, isActive: boolean) {
	pendingActivationId.value = formId;
	pageError.value = null;
	try {
		await setActive({ formId, isActive });
	} catch (error) {
		pageError.value = {
			title: 'Could not update form status',
			message:
				error instanceof Error ? error.message : 'Please try again.',
		};
	} finally {
		pendingActivationId.value = null;
	}
}
const currentTime = ref(Date.now());
let formStatusTimer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
	formStatusTimer = setInterval(() => {
		currentTime.value = Date.now();
	}, 60_000);
});
onBeforeUnmount(() => {
	if (formStatusTimer) clearInterval(formStatusTimer);
});
function formStatus(form: {
	isActive: boolean;
	closeAt: number | null;
}): 'Open' | 'Closed' | 'Inactive' {
	if (!form.isActive) return 'Inactive';
	if (form.closeAt !== null && form.closeAt <= currentTime.value)
		return 'Closed';
	return 'Open';
}
async function copyFormLink(
	slug: string,
	status: 'Open' | 'Closed' | 'Inactive',
) {
	const configuredBase = runtimeConfig.public.siteUrl?.trim();
	const baseUrl = (configuredBase || window.location.origin).replace(
		/\/+$/,
		'',
	);
	const url = `${baseUrl}/preorder/${slug}`;
	try {
		await navigator.clipboard.writeText(url);
		toast.add({
			title: 'Public link copied',
			description:
				status === 'Open'
					? undefined
					: `This form is ${status.toLowerCase()} and will not accept orders.`,
			color: status === 'Open' ? 'success' : 'warning',
		});
	} catch {
		pageError.value = {
			title: 'Copy this public link',
			message:
				status === 'Open'
					? url
					: `${url}\nThis form is ${status.toLowerCase()} and will not accept orders.`,
		};
	}
}
function selectForm(formId: Id<'preorderForms'>) {
	selectedFormId.value = formId;
}
const reviewArgs = computed(() =>
	selectedFormId.value ? { formId: selectedFormId.value } : 'skip',
);
const {
	data: submissions,
	isPending: submissionsPending,
	isDone: submissionsDone,
	isLoadingMore: loadingMoreSubmissions,
	loadMore: loadMoreSubmissions,
} = useConvexPaginatedQuery(api.preorders.listSubmissions, reviewArgs, {
	numItems: 25,
});
const { data: preparationTotals, isPending: preparationPending } =
	useConvexQuery(api.preorders.preparationTotals, reviewArgs, {
		server: false,
	});

// Submission removal. The confirmation names the affected submission and
// quantity; the backend keeps totals and counters consistent.
type ReviewSubmission = {
	_id: Id<'preorderSubmissions'>;
	firstName: string;
	lastName: string;
	items: { quantity: number }[];
};
function submissionTotalQuantity(submission: ReviewSubmission) {
	return submission.items.reduce((total, item) => total + item.quantity, 0);
}
const submissionToRemove = ref<ReviewSubmission | null>(null);
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
			description: `Removed ${submission.firstName} ${submission.lastName} (${submissionTotalQuantity(submission)} items) from ${selectedForm.value?.name ?? 'the form'}.`,
			color: 'success',
		});
	} catch {
		// Keep the confirmation open so the operator can retry.
	} finally {
		pendingRemovalId.value = null;
	}
}

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(
		amount,
	);
const formatDate = (timestamp: number) =>
	new Intl.DateTimeFormat('en', {
		dateStyle: 'medium',
		timeZone: 'Europe/Berlin',
	}).format(timestamp);
const formatDateTime = (timestamp: number) =>
	new Intl.DateTimeFormat('en', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'Europe/Berlin',
	}).format(timestamp);
</script>
