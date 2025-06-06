import type { Peer } from 'crossws';
const clients: Set<Peer> = new Set();

export default defineWebSocketHandler({
	open(peer) {
		clients.add(peer);
		peer.subscribe('liveproducts');
		peer.publish('liveproducts', 'listenup');
		peer.send('listenup');
	},
	close(peer) {
		clients.delete(peer);
		peer.unsubscribe('liveproducts');
	},
});

export function updateLatestBackendData() {
	// latestBackendData = data;
	// Notify all connected clients about the new data
	const peer = clients.entries().next();
	if (!peer.done) {
		const firstPeer = peer.value[0];
		firstPeer.publish('liveproducts', 'plzrefetch');
		firstPeer.send('plzrefetch');
	}
}
