<template>
	<div class="p-2 flex items-center gap-4">
		<NuxtLink to="/">
			<NuxtImg
				src="pwa-192x192.png"
				class="h-16 w-16"
			/>
		</NuxtLink>
		<h1>Visitors: {{ visitors }}</h1>
		<AuthState>
			<template #default="{ loggedIn, user }">
				<template v-if="loggedIn">
					<NuxtLink
						v-for="item in navLinks"
						:key="item.name"
						class="text-lg text-gray-400 hidden md:inline"
						:to="item.to"
					>
						{{ item.name }}
					</NuxtLink>
					<UDropdownMenu :items="items">
						<UButton
							class="ml-auto"
							:title="`Logged in as: ${user.name}`"
							variant="ghost"
						>
							<template #leading>
								<UAvatar
									:src="user.avatar"
									:alt="`Profilbild von ${user.given_name} ${user.family_name}`"
									:text="`${user.given_name[0]}${user.family_name[0]}`"
									size="xl"
									crossorigin="anonymous"
									class="shrink-0"
								/>
							</template>
						</UButton>
						<!-- <UAvatar
							class="ml-auto"
							:src="user.avatar"
							crossorigin="anonymous"
							:title="`Logged in as: ${user.name}`"
							:text="`${user.given_name[0]}${user.family_name[0]}`"
						/> -->
					</UDropdownMenu>
				</template>
				<!-- <UButton
				v-else
				class="ml-auto"
				to="/api/auth/google"
				external
				variant="solid"
				icon="i-lucide-log-in"
				>
				Login
			</UButton> -->
				<GoogleSignIn
					v-else
					class="ml-auto"
				/>
				<!--as of nuxt auth utils v0.5.14-->
				<!-- <UButton
					v-else
					class="ml-auto"
					variant="solid"
					icon="i-lucide-log-in"
					@click="openInPopup('/api/auth/google')"
				>
					Login
				</UButton> -->
			</template>
			<template #placeholder>
				<UButton
					class="ml-auto"
					loading
					loading-icon="i-lucide-loader-circle"
				>
					Please wait
				</UButton>
			</template>
		</AuthState>
		<ColorModeSwitcher />
		<USlideover>
			<UButton
				variant="ghost"
				aria-label="Open Navigation Menu"
				icon="i-lucide-menu"
				class="md:hidden"
				size="md"
			/>
			<template #body>
				<NuxtLink
					v-for="item in navLinks"
					:key="item.name"
					:to="item.to"
					class="-mx-3 flex rounded-lg px-3 py-2 text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-950 focus:bg-gray-50 dark:focus:bg-gray-950"
				>
					<span class="mx-auto">{{ item.name }}</span>
				</NuxtLink>
			</template>
		</USlideover>
	</div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import type { RoutePathSchema } from '@typed-router';

type MaguroNavLink = {
	name: string;
	to: RoutePathSchema;
	original?: string;
};

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

const navLinks: MaguroNavLink[] = [
	{
		name: 'Übersicht',
		to: '/dash/dashboard',
	},
	{
		name: 'Forms',
		to: '/dash/forms',
	},
	{
		name: 'Inventar',
		to: '/dash/inventory',
	},
	{
		name: 'Point of Sale',
		to: '/dash/pointofsale',
	},
	{
		name: 'Transaktionen',
		to: '/dash/transactions',
	},
];

// websocket stuff
const visitors = ref(0);
const { open } = useWebSocket('/ws/visitors', {
	immediate: false,
	async onMessage(ws, event) {
		// We parse the number of connected users from the message
		// The message might be a string or a Blob
		visitors.value = parseInt(
			typeof event.data === 'string'
				? event.data
				: await event.data.text(),
		);
	},
});

// We open the connection when the component is mounted
onMounted(() => {
	open();
});
</script>

<style>
.router-link-exact-active {
	color: hsl(var(--primary));
}
</style>
