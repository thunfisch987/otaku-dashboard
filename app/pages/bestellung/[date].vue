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
								label="Unter welchem Namen möchtest du bestellen?"
								required
							>
								<UInput v-model="state.nameinput" />
							</UFormField>
						</UCard>
						<UCard>
							<UFormField
								label="Bist du Helfer?"
								required
							>
								<UCheckbox
									v-model="state.helfer"
									label="Ja, ich bin Helfer"
								/>
							</UFormField>
						</UCard>
						<UCard>
							<UFormField
								label="Hast du schonmal ein Fomular abgeschickt und möchtest es überschreiben? "
								required
							>
								<UCheckbox
									v-model="state.overwrite"
									label="Ja, ich möchte überschreiben"
								/>
							</UFormField>
						</UCard>
					</div>
				</template>
				<template #foodstep>
					<UCard class="flex">
						<p class="text-center">
							Bilder sind beispielhaft und können von der Realität
							abweichen
						</p>
						{{ state.amount }}
						<UFormField
							label="Anzahl"
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
							Bilder sind beispielhaft und können von der Realität
							abweichen
						</p>
					</UCard>
				</template>
				<template #onigiristep>
					<UCard>
						<p class="text-center">
							Bilder sind beispielhaft und können von der Realität
							abweichen
						</p>
					</UCard>
				</template>
				<template #confirmstep>
					<UCard>
						<p>Zahlung ist nur vor Ort in Bar möglich.</p>
						<br />
						<UFormField name="confirmbox#">
							<UCheckbox
								required
								label="Ich bestätige hiermit, dass ich mich mit der Bestellung auch zur Zahlung verantworte."
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
						Zurück
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
						Weiter
					</UButton>
					<UButton
						v-if="!foodStepperRef?.hasNext"
						trailing-icon="i-lucide-send-horizontal"
						size="xl"
						variant="solid"
						type="submit"
					>
						Abschicken
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
Heyo, diesmal gibt es wieder Donburi, genauer Gyudon.
Aufgrund des Helfermangels und der Besonderheit das diemal das Treffen Samstags ist, mit einer kleineren Karte und keiner vegetarischen Auswahl.

Bitte beachtet das die Küche nur von 16:30-18:00 Uhr geöffnet hat.


Preise:

Gyudon: 6€

Edamame klein: 1€
Edamame groß: 2€


Wie immer kann man auch Onigiri vom Reiseck bestellen
Onigiri: 3€

Die Umfrage läuft bis Donnerstag 20.06.24 18 Uhr
`;

const foodStepperRef = useTemplateRef('foodstepper');

const fields = shallowRef<MyFormField>([
	{
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
		title: 'Essen',
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
		title: 'Bestellung bestätigen',
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
