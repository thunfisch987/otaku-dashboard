<template>
	<UPopover>
		<UButton
			color="neutral"
			variant="subtle"
			icon="i-lucide-calendar"
		>
			{{
				calendarModel
					? df.format(calendarModel.toDate('Europe/Berlin'))
					: 'Select a date'
			}}
		</UButton>

		<template #content>
			<UCalendar
				v-model="calendarModel"
				class="p-2"
				:week-starts-on="1"
				initial-focus
				:min-value="today('Europe/Berlin')"
			/>
		</template>
	</UPopover>
</template>

<script setup lang="ts">
import {
	DateFormatter,
	today,
	getDayOfWeek,
	type DateValue,
} from '@internationalized/date';

defineProps<{
	activeUntil?: boolean;
}>();

const calendarModel = defineModel<DateValue>('calendarModel', {
	default(props) {
		return props.activeUntil
			? defaultDate.subtract({ days: 2 })
			: defaultDate;
	},
});

const df = new DateFormatter('de-DE', {
	dateStyle: 'medium',
});
</script>

<script lang="ts">
let todaysDate = today('Europe/Berlin');

const delta = getDayOfWeek(todaysDate, 'de-DE') - 5;

if (delta) {
	todaysDate = todaysDate.add({ days: (7 - delta) % 7 });
}

const defaultDate = todaysDate.add({ weeks: 2 });
</script>
