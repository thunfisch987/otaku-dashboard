<template>
	<div class="p-2 flex items-center gap-4">
		<NuxtLink to="/">
			<NuxtImg
				src="pwa-192x192.png"
				class="h-16 w-16"
			/>
		</NuxtLink>
		<NuxtLink
			class="text-lg text-gray-400 hidden md:inline"
			to="/dashboard"
		>
			Overview
		</NuxtLink>
		<NuxtLink
			class="text-lg text-gray-400 hidden md:inline"
			to="/forms"
		>
			Forms
		</NuxtLink>
		<NuxtLink
			class="text-lg text-gray-400 hidden md:inline"
			to="/inventory"
		>
			Inventory
		</NuxtLink>
		<NuxtLink
			class="text-lg text-gray-400 hidden md:inline"
			to="/pointofsale"
		>
			Point of Sale
		</NuxtLink>
		<AuthState>
			<template #default="{ loggedIn, clear, user }">
				<Avatar
					v-if="loggedIn"
					class="ml-auto"
				>
					<AvatarImage
						crossorigin="anonymous"
						:src="user.avatar"
						:title="`Logged in as: ${user.name}`"
					/>
					<AvatarFallback>{{ `${user.given_name[0]}${user.family_name[0]}` }}</AvatarFallback>
				</Avatar>
				<Button
					v-if="loggedIn"
					class=""
					@click="clear"
				>
					<LogOut class="w-4 h-4 mr-2" />
					Logout
				</Button>
				<Button
					v-else
					as-child

					class="ml-auto"
				>
					<NuxtLink
						to="/api/auth/google"
						external
					>
						<LogIn class="w-4 h-4 mr-2" />
						Login
					</NuxtLink>
				</Button>
			</template>
			<template #placeholder>
				<Button
					disabled
					class="ml-auto"
				>
					<Loader2 class="w-4 h-4 mr-2 animate-spin" />
					Please wait
				</Button>
			</template>
		</AuthState>
		<Sheet
			v-model:open="open"
		>
			<SheetTrigger
				variant="ghost"
				size="icon"
				aria-label="Open Navigation Menu"
			>
				<Menu
					class="md:hidden"
				/>
			</SheetTrigger>
			<OtakuSide />
		</Sheet>
	</div>
</template>

<script setup lang="ts">
import { Loader2, LogIn, LogOut, Menu } from 'lucide-vue-next';

const open = useState('open', () => false);
</script>

<style>
.router-link-exact-active {
    color: hsl(var(--primary))
}
</style>
