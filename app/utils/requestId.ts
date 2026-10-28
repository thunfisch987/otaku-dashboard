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
		for (let index = 0; index < bytes.length; index += 1) {
			bytes[index] = Math.floor(Math.random() * 256);
		}
	}

	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
		'',
	);
}
