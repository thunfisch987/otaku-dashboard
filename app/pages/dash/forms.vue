<template>
	<div class="flex flex-col">
		<!-- <div>
			<UButton
				class="mr-2"
				@click="addField('text')"
				>Add Text Field</UButton
			>
			<UButton @click="addField('textarea')">Add Textarea Field</UButton>
			
		</div> -->
		<!-- <UCard>
			<template #header>Bestellformular</template>
			<UForm
				:state="state"
				class="flex flex-col space-y-2"
			>
				<div
					v-for="(field, index) in fields"
					:key="index"
					class="flex space-x-2"
				>
					<component
						:is="field.component"
						v-bind="field.props"
						v-model="field.value"
					/>
					<UButton
						icon="i-lucide-x"
						variant="ghost"
						color="error"
						@click="removeField(index)"
					/>
					<span>{{ index }}</span>
					<span>{{ field.value }}</span>
				</div>
			</UForm>
			<template #footer>
				<div class="flex">
					<UButton>Cancel</UButton>
					<UButton class="ml-auto">Submit</UButton>
				</div>
			</template>
		</UCard> -->
		<UForm
			:state="state"
			@submit="
				(submitEvent: FormSubmitEvent<object>) =>
					console.dir(submitEvent.data)
			"
		>
			<UCard class="m-4">
				<UFormField label="Datum des Treffens:">
					<DatePicker v-model:calendar-model="state.eventDate" />
				</UFormField>
				<br />
				<UFormField label="Aktiv bis:">
					<DatePicker
						v-model:calendar-model="state.activeUntil"
						active-until
					/>
				</UFormField>
				<UInput
					v-model="state.activeUntilTime"
					type="time"
				/>
			</UCard>
			<DevOnly>
				<div class="flex justify-around my-4">
					<div>
						<UButton
							v-if="foodStepperRef?.hasPrev"
							trailing-icon="i-lucide-arrow-left"
							size="xl"
							variant="subtle"
							@click="foodStepperRef?.prev()"
						>
							Go Back
						</UButton>
					</div>
					<div>
						<UButton
							v-if="foodStepperRef?.hasNext"
							trailing-icon="i-lucide-arrow-right"
							size="xl"
							variant="subtle"
							@click="foodStepperRef?.next()"
						>
							Next
						</UButton>
						<UButton
							v-if="!foodStepperRef?.hasNext"
							trailing-icon="i-lucide-send-horizontal"
							size="xl"
							variant="solid"
							type="submit"
						>
							Submit
						</UButton>
					</div>
				</div>
			</DevOnly>
			<UStepper
				ref="foodstepper"
				:items="items"
				class="mt-4 p-4"
				size="xl"
				disabled
				:model-value="currentStep"
			>
				<template #namestep>
					<div class="flex flex-col space-y-2">
						<UCard>
							<UFormField
								label="Write or paste any text here"
								required
							>
								<UTextarea
									v-model="state.text"
									autoresize
									class="mx-0 min-w-full"
								/>
							</UFormField>
						</UCard>
						<UCard>
							<UFormField
								label="What name should the order be placed under?"
								required
							>
								<UInput v-model="state.nameinput" />
							</UFormField>
						</UCard>
						<UCard>
							<UFormField
								label="Are you a helper?"
								required
							>
								<UCheckbox
									v-model="state.helfer"
									label="Yes, I'm a helper"
								/>
							</UFormField>
						</UCard>
						<UCard>
							<UFormField
								label="Have you already submitted a form and want to overwrite it?"
								required
							>
								<UCheckbox
									v-model="state.overwrite"
									label="Yes, I want to overwrite it"
								/>
							</UFormField>
						</UCard>
					</div>
				</template>
				<template #foodstep>
					<UCard class="flex">
						<p class="text-center">
							Images are for illustration and may differ from
							actual dishes
						</p>
						{{ state.amount }}
						<UFormField
							label="Amount"
							required
							class="ml-0 mx-auto"
						>
							<USlider
								v-model="state.amount"
								:max="8"
								name="Amount"
							/>
						</UFormField>
					</UCard>
				</template>
				<template #snacksstep>
					<UCard>
						<p class="text-center">
							Images are for illustration and may differ from
							actual dishes
						</p>
					</UCard>
				</template>
				<template #onigiristep>
					<UCard>
						<UFormField>
							<UCheckboxGroup
								v-model="state.onigiriSorten"
								:items="onigiriSorten"
								:ui="{ label: 'bg-disabled' }"
							>
								<template #label="{ item }">
									//
									{{ item.label }}
								</template>
							</UCheckboxGroup>
						</UFormField>
						{{ state.onigiriSorten }}
					</UCard>
				</template>
				<template #confirmstep>
					<UCard>
						<p>Payment is only possible on-site in cash.</p>
						<br />
						<UFormField name="confirmbox">
							<UCheckbox
								required
								label="I hereby confirm that by placing this order I also accept responsibility for paying for it."
							/>
						</UFormField>
					</UCard>
				</template>
			</UStepper>
			<div class="flex justify-around my-4">
				<div>
					<UButton
						v-if="foodStepperRef?.hasPrev"
						trailing-icon="i-lucide-arrow-left"
						size="xl"
						variant="subtle"
						@click="foodStepperRef?.prev()"
					>
						Go Back
					</UButton>
				</div>
				<div>
					<UButton
						v-if="foodStepperRef?.hasNext"
						trailing-icon="i-lucide-arrow-right"
						size="xl"
						variant="subtle"
						:disabled="state.nameinput.length < 1"
						@click="foodStepperRef?.next()"
					>
						Next
					</UButton>
					<UButton
						v-if="!foodStepperRef?.hasNext"
						trailing-icon="i-lucide-send-horizontal"
						size="xl"
						variant="solid"
						type="submit"
					>
						Submit
					</UButton>
				</div>
			</div>
		</UForm>
	</div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent, InputProps, StepperItem } from '@nuxt/ui';
import type { CalendarDate } from '@internationalized/date';

// type MyFormField = { component: Component; props: InputProps; value: string }[];

const toext = `Heyo, we have Donburi again this time, specifically Gyudon.
Due to a lack of helpers and because this meeting takes place on a Saturday, the menu is smaller and there is no vegetarian option.

Please note that the kitchen is only open from 4:30 pm to 6:00 pm.

Prices:

Gyudon: 6€

Edamame small: 1€
Edamame large: 2€

As always, you can also order Onigiri from Reiseck
Onigiri: 3€
`;

const foodStepperRef = useTemplateRef('foodstepper');

const currentStep = useState<number>('currentStep');

type MyStepperItem = StepperItem & {
	formData?: { component: Component; props: InputProps; value: string }[];
};

const items: MyStepperItem[] = [
	{
		title: 'Name',
		description: '',
		slot: 'namestep',
		icon: 'i-ph-hash',
		value: 0,
	},
	{
		title: 'Food',
		description: '',
		slot: 'foodstep',
		// formData: fields.value,
		icon: 'i-ph-bowl-steam',
		value: 1,
	},
	{
		title: 'Snacks',
		description: '',
		slot: 'snacksstep',
		icon: 'i-ph-cookie',
		value: 2,
	},
	{
		title: 'Onigiri',
		description: '',
		slot: 'onigiristep',
		icon: 'i-ph-onigiri',
		value: 3,
	},
	{
		title: 'Confirm order',
		slot: 'confirmstep',
		description: '',
		icon: 'i-ph-check-fat',
		value: 4,
	},
];

type onigiriSortenTypes = [
	'Avocado (Vegan)',
	'Peanut Sesame',
	'Shrimp',
	'Chicken Teriyaki',
	'Inari (Vegan)',
	'Salmon Teriyaki',
	'Shiitake (Vegan)',
	'Tuna Mayo',
	'Spicy Tuna',
];

const onigiriSorten = ref<onigiriSortenTypes>([
	'Avocado (Vegan)',
	'Peanut Sesame',
	'Shrimp',
	'Chicken Teriyaki',
	'Inari (Vegan)',
	'Salmon Teriyaki',
	'Shiitake (Vegan)',
	'Tuna Mayo',
	'Spicy Tuna',
]);

type stateTypes = {
	nameinput: string;
	helfer: boolean;
	overwrite: boolean;
	confirmbox: boolean;
	amount: number;
	text: string;
	eventDate: undefined;
	activeUntil: undefined;
	activeUntilTime: string;
	onigiriSorten: onigiriSortenTypes;
};

const state = reactive<stateTypes>({
	nameinput: '',
	helfer: false,
	overwrite: false,
	confirmbox: false,
	amount: 0,
	text: toext,
	eventDate: undefined,
	activeUntil: undefined,
	activeUntilTime: '12:00',
	onigiriSorten: [
		'Avocado (Vegan)',
		'Peanut Sesame',
		'Shrimp',
		'Chicken Teriyaki',
		'Inari (Vegan)',
		'Salmon Teriyaki',
		'Shiitake (Vegan)',
		'Tuna Mayo',
		'Spicy Tuna',
	],
});

watch(
	() => state.eventDate as unknown as CalendarDate,
	(eventDate: CalendarDate) =>
		//@ts-expect-error state.activeUntil is type undefined
		(state.activeUntil = eventDate.subtract({ days: 3 })),
);
</script>
