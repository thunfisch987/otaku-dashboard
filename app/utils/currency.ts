/**
 * Every price in the app renders through this formatter so operator screens,
 * the public preorder flow, and CSV exports always agree on German notation:
 * `3,50 €`. `de-DE` puts the symbol after the amount and separates the two
 * with a non-breaking space, so a price never breaks across lines.
 *
 * Values stay plain numbers in the database and in form inputs; only display
 * and export text is formatted.
 */
const currencyFormatter = new Intl.NumberFormat('de-DE', {
	style: 'currency',
	currency: 'EUR',
});

export function formatCurrency(amount: number) {
	return currencyFormatter.format(amount);
}

export function formatOptionalCurrency(amount: number | undefined) {
	return amount === undefined ? '—' : currencyFormatter.format(amount);
}

/**
 * Editable money fields hold text rather than a formatted price, so they need
 * a plain German decimal: comma for cents, no symbol and no thousands dots
 * (`3,50`, never `3.50`). Parsers accept either separator, but values are
 * displayed and prefilled in the notation operators read.
 */
export function formatMoneyInput(amount: number) {
	return amount.toFixed(2).replace('.', ',');
}
