<template>
	<div class="h-screen flex flex-col">
		<NuxtRouteAnnouncer />
		<NuxtPwaManifest />
		<UApp>
			<NuxtLoadingIndicator color="#E11D48" />
			<OtakuNav />
			<USeparator />
			<div
				v-if="awaitingNavigationKey"
				class="fixed inset-x-4 bottom-5 z-50 mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-default bg-default px-4 py-3 shadow-lg"
				role="status"
				aria-live="polite"
			>
				<span class="text-sm font-medium text-highlighted">Go to:</span>
				<span
					v-for="shortcut in navigationShortcutLabels"
					:key="shortcut.key"
					class="inline-flex items-center gap-1 text-sm text-muted"
				>
					<kbd
						class="rounded border border-default bg-elevated px-1.5 py-0.5 font-mono text-xs font-semibold text-highlighted"
						>{{ shortcut.key }}</kbd
					>
					{{ shortcut.page }}
				</span>
				<span class="text-xs text-muted">Esc to cancel</span>
			</div>
			<main>
				<NuxtPage />
			</main>
			<USeparator class="mt-auto" />
			<OtakuFooter />
		</UApp>
	</div>
</template>

<script setup lang="ts">
const navigationShortcuts: Record<string, string> = {
	d: '/dash/dashboard',
	f: '/dash/forms',
	i: '/dash/inventory',
	p: '/dash/pointofsale',
	t: '/dash/transactions',
	u: '/dash/users',
};

const navigationShortcutLabels = [
	{ key: 'D', page: 'Dashboard' },
	{ key: 'F', page: 'Forms' },
	{ key: 'I', page: 'Inventory' },
	{ key: 'P', page: 'Point of sale' },
	{ key: 'T', page: 'Transactions' },
	{ key: 'U', page: 'Users' },
];

const awaitingNavigationKey = ref(false);
let navigationKeyTimeout: ReturnType<typeof setTimeout> | undefined;

function handleNavigationShortcut(event: KeyboardEvent) {
	const target = event.target;
	if (
		target instanceof HTMLElement &&
		(target.isContentEditable ||
			['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
	) {
		return;
	}

	if (event.altKey || event.ctrlKey || event.metaKey) return;

	const key = event.key.toLowerCase();
	if (key === 'escape') {
		awaitingNavigationKey.value = false;
		clearTimeout(navigationKeyTimeout);
		return;
	}

	if (awaitingNavigationKey.value) {
		awaitingNavigationKey.value = false;
		clearTimeout(navigationKeyTimeout);
		const destination = navigationShortcuts[key];
		if (destination) {
			event.preventDefault();
			void navigateTo(destination);
		}
		return;
	}

	if (key === 'g' && !event.shiftKey) {
		awaitingNavigationKey.value = true;
		navigationKeyTimeout = setTimeout(() => {
			awaitingNavigationKey.value = false;
		}, 2000);
	}
}

onMounted(() => window.addEventListener('keydown', handleNavigationShortcut));
onBeforeUnmount(() => {
	window.removeEventListener('keydown', handleNavigationShortcut);
	clearTimeout(navigationKeyTimeout);
});
</script>
