<template>
	<SheetContent>
		<SheetHeader>
			<SheetTitle>
				Navigation
			</SheetTitle>
			<SheetDescription>These are the other pages</SheetDescription>
		</SheetHeader>
		<NuxtLink
			v-for="item in navLinks"
			:key="item.name"
			:to="item.to"
			class="-mx-3 flex rounded-lg px-3 py-2 text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-950 focus:bg-gray-50 dark:focus:bg-gray-950"
		>
			<span class="mx-auto">{{ item.name }}</span>
		</NuxtLink>
		<SheetFooter />
	</SheetContent>
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
