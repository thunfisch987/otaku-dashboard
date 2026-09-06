<template>
	<UDropdownMenu :items="items">
		<UButton
			:title="`Logged in as: ${user?.name}`"
			variant="ghost"
		>
			<template #leading>
				<UAvatar
					:src="user?.image ?? undefined"
					:text="user?.name?.slice(0, 2).toUpperCase()"
					size="xl"
					crossorigin="anonymous"
					class="shrink-0"
				/>
			</template>
		</UButton>
	</UDropdownMenu>
</template>

<script setup lang="ts">
import type { AuthUser } from '#nuxt-better-auth';
import type { DropdownMenuItem } from '@nuxt/ui';

const { user } = defineProps<{ user: AuthUser | null }>();

const { signOut } = useUserSession();

async function clearSession() {
	await signOut();
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
