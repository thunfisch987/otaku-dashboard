<template>
	<div class="p-2 flex items-center gap-4">
		<NuxtLink to="/">
			<NuxtImg
				src="pwa-192x192.png"
				class="h-16 w-16"
			/>
		</NuxtLink>
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
					<ClientOnly>
						<span
							v-if="expiresIn > 0"
							class="ml-auto"
						>
							Token expires in {{ expiresIn }} minutes
						</span>
						<template v-else>
							<span class="ml-auto"> Token expired </span>
							<UButton
								class="ml-auto"
								icon="i-lucide-rotate-ccw-key"
								external
								to="/api/auth/google"
							/>
						</template>
						<template #fallback>
							<span class="ml-auto">
								Token expires in - minutes
							</span>
						</template>
					</ClientOnly>
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
		<UColorModeButton>
			<template #fallback>
				<UButton
					loading
					variant="ghost"
					color="neutral"
				/>
			</template>
		</UColorModeButton>
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

const expiresIn = ref(0);

type MaguroNavLink = {
	name: string;
	to: RoutePathSchema;
	original?: string;
};

const { clear, user: userSession } = useUserSession();

onNuxtReady(() => {
	if (userSession.value) {
		expiresIn.value = Math.floor(
			(userSession.value.tokens.expires_at - Date.now()) / 1000 / 60,
		);
	}
	setInterval(() => {
		if (userSession.value) {
			expiresIn.value = Math.floor(
				(userSession.value.tokens.expires_at - Date.now()) / 1000 / 60,
			);
		}
	}, 10000);
});

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
</script>

<style>
.router-link-exact-active {
	color: hsl(var(--primary));
}
</style>
