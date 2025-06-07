import type { Peer } from 'crossws';
const clients: Set<Peer> = new Set();

export default defineWebSocketHandler({
	open(peer) {
		clients.add(peer);
		peer.subscribe('liveproducts');
		peer.publish('liveproducts', 'listenup');
		peer.send('listenup');
		console.log('opening liveproducts');
		console.log(peer);
	},
	close(peer) {
		clients.delete(peer);
		peer.unsubscribe('liveproducts');
		console.log('closing liveproducts');
		console.log(peer);
	},
});

export function updateLatestBackendData() {
	console.log('updateLatestBackendData');
	// latestBackendData = data;
	// Notify all connected clients about the new data
	const peer = clients.entries().next();
	console.dir(clients);
	for (const value of clients) {
		console.log('value');
		console.log(value);
	}
	if (!peer.done) {
		const firstPeer = peer.value[0];
		console.log('firstPeer');
		console.log(firstPeer);
		firstPeer.publish('liveproducts', 'plzrefetch');
		firstPeer.send('plzrefetch');
	}
}
