<template>
	<UDropdownMenu :items="items">
		<UButton
			:title="`Logged in as: ${user!.name}`"
			variant="ghost"
		>
			<template #leading>
				<UAvatar
					:src="user!.avatar"
					:text="`${user!.given_name[0]}${user!.family_name[0]}`"
					size="xl"
					crossorigin="anonymous"
					class="shrink-0"
				/>
			</template>
		</UButton>
	</UDropdownMenu>
</template>

<script setup lang="ts">
import type { User } from '#auth-utils';
import type { DropdownMenuItem } from '@nuxt/ui';

const props = defineProps<{
	user: User | null;
}>();

const { clear } = useUserSession();

async function clearSession() {
	await clear();
	navigateTo('/');
}

const items: DropdownMenuItem[] = [
	{
		label: 'Logout',
		icon: 'i-lucide-log-out',
		onSelect: () => {
			clearSession();
		},
	},
];
</script>
