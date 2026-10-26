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
					console.log(submitEvent.data)
			"
		>
			<UStepper
				ref="foodstepper"
				:items="items"
				class="mt-4 p-4"
				size="xl"
				disabled
			>
				<!-- <template #content="{ item }">
					<UForm
						:state="state"
						class="flex flex-col space-y-2"
					>
						<div
							v-for="(field, index) in item.formData"
							:key="index"
							class="flex space-x-2"
						>
							<component
								:is="field.component"
								v-bind="field.props"
								v-model="field.value"
							/>
							<span>{{ index }}</span>
							<span>{{ field.value }}</span>
						</div>
				</template> -->
				<template #namestep>
					<div class="flex flex-col space-y-2">
						<UCard>
							<UTextarea
								v-model="state.text"
								autoresize
								class="mx-0 min-w-full"
							/>
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
						<p class="text-center">
							Images are for illustration and may differ from
							actual dishes
						</p>
					</UCard>
				</template>
				<template #confirmstep>
					<UCard>
						<p>Payment is only possible on-site in cash.</p>
						<br />
						<UFormField name="confirmbox#">
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
import { UInput } from '#components';
import type { FormSubmitEvent, InputProps, StepperItem } from '@nuxt/ui';

type MyFormField = { component: Component; props: InputProps; value: string }[];

const toext = `
Heyo, we have Donburi again this time, specifically Gyudon.
Due to a lack of helpers and because this meeting takes place on a Saturday, the menu is smaller and there is no vegetarian option.

Please note that the kitchen is only open from 4:30 pm to 6:00 pm.

Prices:

Gyudon: 6€

Edamame small: 1€
Edamame large: 2€

As always, you can also order Onigiri from Reiseck
Onigiri: 3€

The survey runs until Thursday June 20, 2024, 6:00 pm
`;

const foodStepperRef = useTemplateRef('foodstepper');

const fields = shallowRef<MyFormField>([
	{
		// @ts-expect-error UInput is a component
		component: UInput,
		props: { placeholder: 'Enter text' },
		value: '',
	},
]);

type MyStepperItem = StepperItem & {
	formData?: { component: Component; props: InputProps; value: string }[];
};

const items: MyStepperItem[] = [
	{
		title: 'Name',
		description: '',
		slot: 'namestep',
		icon: 'i-ph-hash',
	},
	{
		title: 'Food',
		description: '',
		slot: 'foodstep',
		formData: fields.value,
		icon: 'i-ph-bowl-steam',
	},
	{
		title: 'Snacks',
		description: '',
		slot: 'snacksstep',
		icon: 'i-ph-cookie',
	},
	{
		title: 'Onigiri',
		description: '',
		slot: 'onigiristep',
		icon: 'i-ph-onigiri',
	},
	{
		title: 'Confirm order',
		slot: 'confirmstep',
		description: '',
		icon: 'i-ph-check-fat',
	},
];

const state = reactive({
	nameinput: '',
	helfer: false,
	overwrite: false,
	confirmbox: false,
	amount: 0,
	text: toext,
});

// function addField(type: 'text' | 'textarea') {
// 	const field = createField(type);
// 	if (field) fields.value.push(field);
// 	triggerRef(fields);
// }

// function createField(type: 'text' | 'textarea') {
// 	switch (type) {
// 		case 'text':
// 			return {
// 				component: UInput,
// 				props: { placeholder: 'Enter text' },
// 				value: '',
// 			};
// 		case 'textarea':
// 			return {
// 				component: UInput,
// 				props: { placeholder: 'Enter more text' },
// 				value: '',
// 			};
// 		// Add more field types as needed
// 		default:
// 			return null;
// 	}
// }

// function updateFieldValue(index: number, value: string) {
// 	if (fields.value[index]) {fields.value[index].props}
// }
// function removeField(index: number) {
// 	fields.value.splice(index, 1);
// }
</script>

<style scoped>
/* Add styles as necessary */
</style>
