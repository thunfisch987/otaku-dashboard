<template>
	<UFooter>
		<template #default>
			<div class="flex items-center gap-4">
				<p>Made by thunfisch987 :)</p>
				<NuxtLink
					to="/privacy"
					class="text-sm text-muted hover:text-default underline"
				>
					Privacy policy
				</NuxtLink>
			</div>
		</template>

		<template #right>
			<UButton
				icon="i-simple-icons-github"
				color="neutral"
				variant="ghost"
				to="https://github.com/thunfisch987/otaku-dashboard"
				target="_blank"
				aria-label="GitHub"
			/>
		</template>
	</UFooter>
</template>

<script setup lang="ts"></script>
