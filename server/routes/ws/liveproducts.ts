export default defineWebSocketHandler({
	open(peer) {
		peer.subscribe('liveproducts');
		peer.publish('liveproducts', 'listenup');
		peer.send('listenup');
	},
	message(peer, message) {
		switch (message.text()) {
			case 'ping':
				peer.send('pong');
				break;
			case 'plzrefetchclient':
				console.log('plzrefetchserver');
				peer.publish('liveproducts', 'plzrefetchserver');
				peer.send('plzrefetchserver');
				break;
			default:
				console.log('received message');
				console.log(message);
				break;
		}
	},
	close(peer) {
		peer.unsubscribe('liveproducts');
	},
});

// export function updateLatestBackendData() {
// 	console.log('updateLatestBackendData');
// 	// latestBackendData = data;
// 	// Notify all connected clients about the new data
// 	const peer = clients.entries().next();
// 	console.dir(clients);
// 	for (const value of clients) {
// 		console.log('value');
// 		console.log(value);
// 	}
// 	if (!peer.done) {
// 		const firstPeer = peer.value[0];
// 		console.log('firstPeer');
// 		console.log(firstPeer);
// 		firstPeer.publish('liveproducts', 'plzrefetch');
// 		firstPeer.send('plzrefetch');
// 	}
// }
