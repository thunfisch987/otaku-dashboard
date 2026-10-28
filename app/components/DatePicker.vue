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
import { DateFormatter, today, type DateValue } from '@internationalized/date';
const calendarModel = defineModel<DateValue>('calendarModel');

const df = new DateFormatter('en', {
	dateStyle: 'medium',
});
</script>
