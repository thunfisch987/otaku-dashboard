<template>
	<UHeader
		to="/"
		title="Otaku Dashboard"
	>
		<template #title>
			<NuxtImg
				src="pwa-192x192.png"
				class="h-16 w-16"
			/>
		</template>

		<template #default>
			<ClientOnly>
				<BetterAuthState v-slot="{ loggedIn }">
					<UNavigationMenu
						v-if="loggedIn"
						:items="items"
					/>
				</BetterAuthState>
				<template #fallback>
					<div class="h-8" />
				</template>
			</ClientOnly>
		</template>

		<template #right>
			<ClientOnly>
				<BetterAuthState>
					<template #default="{ loggedIn, user }">
						<template v-if="loggedIn">
							<LazyUserMenu :user="user" />
						</template>
						<template v-else>
							<div class="ml-auto flex items-center gap-2">
								<LazyGoogleSignIn />
								<LazyPasskeySignIn />
							</div>
						</template>
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
				</BetterAuthState>
				<template #fallback>
					<UButton
						class="ml-auto"
						loading
						loading-icon="i-lucide-loader-circle"
					>
						Please wait
					</UButton>
				</template>
			</ClientOnly>
			<UColorModeButton>
				<template #fallback>
					<UButton
						loading
						variant="ghost"
						color="neutral"
					/>
				</template>
			</UColorModeButton>
		</template>

		<template #body>
			<ClientOnly>
				<BetterAuthState v-slot="{ loggedIn }">
					<UNavigationMenu
						v-if="loggedIn"
						:items="items"
						orientation="vertical"
						class="-mx-2.5"
					/>
					<p v-else>Please log in</p>
				</BetterAuthState>
				<template #fallback>
					<p>Please log in</p>
				</template>
			</ClientOnly>
		</template>
	</UHeader>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import type { RoutePathSchema } from '@typed-router';

interface MaguroNavLink extends NavigationMenuItem {
	to: RoutePathSchema;
}

const route = useRoute();

const items = computed<MaguroNavLink[]>(() => [
	{
		label: 'Übersicht',
		to: '/dash/dashboard',
		active: route.path === '/dash/dashboard',
	},
	{
		label: 'Forms',
		to: '/dash/forms',
		active: route.path === '/dash/forms',
	},
	{
		label: 'Inventar',
		to: '/dash/inventory',
		active: route.path === '/dash/inventory',
	},
	{
		label: 'Point of Sale',
		to: '/dash/pointofsale',
		active: route.path === '/dash/pointofsale',
	},
	{
		label: 'Transaktionen',
		to: '/dash/transactions',
		active: route.path === '/dash/transactions',
	},
	{
		label: 'Benutzer',
		to: '/dash/users',
		active: route.path === '/dash/users',
	},
]);
</script>

<style>
.router-link-exact-active {
	color: hsl(var(--primary));
}
</style>
