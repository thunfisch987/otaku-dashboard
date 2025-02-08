<template>
	<div class="p-2 flex items-center gap-4">
		<NuxtLink to="/">
			<NuxtImg
				src="pwa-192x192.png"
				class="h-16 w-16"
			/>
		</NuxtLink>
		<AuthState>
			<template #default="{ loggedIn, clear, user }">
				<NuxtLink
					v-if="loggedIn"
					class="text-lg text-gray-400 hidden md:inline"
					to="/dash/dashboard"
				>
					Overview
				</NuxtLink>
				<NuxtLink
					v-if="loggedIn"
					class="text-lg text-gray-400 hidden md:inline"
					to="/dash/forms"
				>
					Forms
				</NuxtLink>
				<NuxtLink
					v-if="loggedIn"
					class="text-lg text-gray-400 hidden md:inline"
					to="/dash/inventory"
				>
					Inventory
				</NuxtLink>
				<NuxtLink
					v-if="loggedIn"
					class="text-lg text-gray-400 hidden md:inline"
					to="/dash/pointofsale"
				>
					Point of Sale
				</NuxtLink>
				<UAvatar
					v-if="loggedIn"
					class="ml-auto"
					:src="user.avatar"
					crossorigin="anonymous"
					:title="`Logged in as: ${user.name}`"
					:text="`${user.given_name[0]}${user.family_name[0]}`"
				/>
				<UButton
					v-if="loggedIn"
					@click="clear"
				>
					<LogOut class="w-4 h-4 mr-2" />
					Logout
				</UButton>
				<UButton
					v-else
					class="ml-auto"
					to="/api/auth/google"
					external
					variant="outline"
				>
					<LogIn class="w-4 h-4 mr-2" />
					Login
				</UButton>
			</template>
			<template #placeholder>
				<UButton
					disabled
					class="ml-auto"
				>
					<Loader2 class="w-4 h-4 mr-2 animate-spin" />
					Please wait
				</UButton>
			</template>
		</AuthState>
		<ColorModeSwitcher />
		<USlideover>
			<UButton
				variant="ghost"
				aria-label="Open Navigation Menu"
			>
				<Menu class="md:hidden" />
			</UButton>
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
import { Loader2, LogIn, LogOut, Menu } from 'lucide-vue-next';

import type { RoutePathSchema } from '@typed-router';

type MaguroNavLink = {
	name: string;
	to: RoutePathSchema;
	original?: string;
};

const navLinks: MaguroNavLink[] = [
	{
		name: 'Dashboard',
		to: '/dash/dashboard',
	},
	{
		name: 'Forms',
		to: '/dash/forms',
	},
	{
		name: 'Inventory',
		to: '/dash/inventory',
	},
	{
		name: 'Point of Sale',
		to: '/dash/pointofsale',
	},
];
</script>

<style>
.router-link-exact-active {
	color: hsl(var(--primary));
}
</style>
