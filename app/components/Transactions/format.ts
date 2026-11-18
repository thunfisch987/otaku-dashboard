import type { SaleItem } from './types';

const timeFormatter = new Intl.DateTimeFormat('en', {
	hour: '2-digit',
	minute: '2-digit',
});

export function formatSaleTime(timestamp: number) {
	return timeFormatter.format(timestamp);
}

/** Short product summary for one sale, e.g. "Onigiri × 2, Tea × 1 +2 more". */
export function summarizeSaleItems(items: SaleItem[], limit = 3) {
	const shown = items
		.slice(0, limit)
		.map((item) => `${item.productName} × ${item.quantity}`);
	const remaining = items.length - shown.length;
	return remaining > 0
		? `${shown.join(', ')} +${remaining} more`
		: shown.join(', ');
}
