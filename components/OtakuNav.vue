<template>
	<div class="p-2 flex items-center gap-4">
		<NuxtImg
			src="/img/logo.png"
			class="h-16 w-16"
		/>
		<NuxtLink
			class="text-lg text-gray-400"
			to="/"
		>
			Overview
		</NuxtLink>
		<NuxtLink
			class="text-lg text-gray-400"
			to="/forms"
		>
			Forms
		</NuxtLink>
		<NuxtLink
			class="text-lg text-gray-400"
			to="/inventory"
		>
			Inventory
		</NuxtLink>
		<NuxtLink
			class="text-lg text-gray-400"
			to="/pointofsale"
		>
			Point of Sale
		</NuxtLink>
	</div>
</template>

<style>
.router-link-exact-active {
    color: hsl(var(--primary))
}
</style>
