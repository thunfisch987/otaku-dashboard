<template>
	<UPopover>
		<UButton
			color="neutral"
			variant="subtle"
			icon="i-lucide-calendar"
		>
			{{
				model
					? df.format(model.toDate(getLocalTimeZone()))
					: 'Select a date'
			}}
		</UButton>

		<template #content>
			<UCalendar
				v-model="model"
				class="p-2"
				:week-starts-on="1"
				initial-focus
				:min-value="today(getLocalTimeZone())"
			/>
		</template>
	</UPopover>
</template>

<script setup lang="ts">
import {
	type CalendarDate,
	DateFormatter,
	getLocalTimeZone,
	today,
} from '@internationalized/date';

const model = defineModel<CalendarDate>({
	default: today(getLocalTimeZone()),
});

const df = new DateFormatter('de-DE', {
	dateStyle: 'medium',
});
</script>
