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
					<LazyTokenExpireTimer />
					<LazyUserMenu :user="user" />
				</template>
				<template v-else>
					<LazyGoogleSignIn class="ml-auto" />
					<UButton
						external
						to="/api/auth/osu"
						>osu!</UButton
					>
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
import type { RoutePathSchema } from '@typed-router';

type MaguroNavLink = {
	name: string;
	to: RoutePathSchema;
	original?: string;
};

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
