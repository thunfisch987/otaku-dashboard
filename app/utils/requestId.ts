/** Create a request identifier without relying on the secure-context-only UUID API. */
export function createRequestId() {
	const webCrypto = globalThis.crypto;
	if (typeof webCrypto?.randomUUID === 'function') {
		return webCrypto.randomUUID();
	}

	const bytes = new Uint8Array(16);
	if (typeof webCrypto?.getRandomValues === 'function') {
		webCrypto.getRandomValues(bytes);
	} else {
		fallbackRandomBytes(bytes);
	}

	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
		'',
	);
}

let fallbackCounter = 0;

/**
 * Crypto-free fallback used on non-HTTPS venue LANs, where this token dedupes
 * submissions. Math.random alone can repeat across concurrently opened pages,
 * so mix in the current timestamp and a monotonic counter: the first six bytes
 * come from the clock, the next two from a per-page counter, and the remaining
 * eight from Math.random.
 */
function fallbackRandomBytes(bytes: Uint8Array) {
	fallbackCounter = (fallbackCounter + 1) % 0x1_0000;
	let timestamp = Date.now();
	for (let index = 5; index >= 0; index -= 1) {
		bytes[index] = timestamp % 256;
		timestamp = Math.floor(timestamp / 256);
	}
	bytes[6] = Math.floor(fallbackCounter / 256) % 256;
	bytes[7] = fallbackCounter % 256;
	for (let index = 8; index < bytes.length; index += 1) {
		bytes[index] = Math.floor(Math.random() * 256);
	}
}
