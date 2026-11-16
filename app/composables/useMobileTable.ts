/**
 * Mobile table presentation helpers.
 *
 * The phone layouts are real, shipped layouts; the `?mobile=` query override
 * only exists in `nuxt dev` so each one can be reviewed side by side on a
 * device before we settle on a default.
 */
export const inventoryMobileVariants = [
	'priority',
	'cards',
	'compact',
] as const;

export type InventoryMobileVariant = (typeof inventoryMobileVariants)[number];

/** True below Tailwind's `md` breakpoint (tablet and up keeps the table). */
export function useIsMobileTable() {
	const isMobile = ref(false);
	let mediaQuery: MediaQueryList | null = null;

	const update = () => {
		isMobile.value = mediaQuery?.matches ?? false;
	};

	onMounted(() => {
		mediaQuery = window.matchMedia('(max-width: 767px)');
		update();
		mediaQuery.addEventListener('change', update);
	});

	onBeforeUnmount(() => {
		mediaQuery?.removeEventListener('change', update);
	});

	return isMobile;
}

export function useMobileTableVariant<T extends string>(
	variants: readonly T[],
	fallback: T,
) {
	const route = useRoute();

	return computed<T>(() => {
		if (!import.meta.dev) return fallback;
		const raw = route.query.mobile;
		const value = Array.isArray(raw) ? raw[0] : raw;
		return variants.includes(value as T) ? (value as T) : fallback;
	});
}
