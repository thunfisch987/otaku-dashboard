<template>
	<UHeader
		v-model:open="menuOpen"
		to="/"
		title="Otaku Dashboard"
	>
		<template #title>
			<NuxtImg
				src="pwa-192x192.png"
				class="h-16 w-16"
				alt="Logo der Anitoria Trier"
			/>
		</template>

		<!--
			The session resolves only on the client, so the toggle must live in a
			stable client-only boundary. Rendering it from `signedIn` directly
			would make the server render no button while the client hydrates one.
		-->
		<template #toggle="{ open, toggle, ui }">
			<ClientOnly>
				<UButton
					v-if="signedIn"
					color="neutral"
					variant="ghost"
					:aria-label="open ? 'Close menu' : 'Open menu'"
					:icon="open ? 'i-lucide-x' : 'i-lucide-menu'"
					data-slot="toggle"
					:class="ui.toggle({ toggleSide: 'right' })"
					@click="toggle"
				/>
			</ClientOnly>
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
							<div
								class="ml-auto hidden items-center gap-2 sm:flex"
							>
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
				</BetterAuthState>
				<template #fallback>
					<p class="py-2 text-muted">Checking your session…</p>
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

// Operators only: signed-out visitors have nothing to navigate to, so the
// header hides the menu toggle entirely until a session exists.
const { loggedIn: signedIn } = useUserSession();

// The toggle disappears when the session ends, so close the menu ourselves
// instead of leaving an overlay that no longer has a close control.
const menuOpen = ref(false);

watch(signedIn, (isSignedIn) => {
	if (!isSignedIn) menuOpen.value = false;
});

const route = useRoute();

const items = computed<MaguroNavLink[]>(() => [
	{
		label: 'Overview',
		to: '/dash/dashboard',
		active: route.path === '/dash/dashboard',
	},
	{
		label: 'Forms',
		to: '/dash/forms',
		active: route.path === '/dash/forms',
	},
	{
		label: 'Inventory',
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
]);
</script>

<style>
.router-link-exact-active {
	color: hsl(var(--primary));
}
</style>
