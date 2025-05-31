let clients = [];
// let latestBackendData = 'Waiting for backend check...';

export default defineEventHandler((event) => {
	console.log('headers');
	setResponseHeader(event, 'Content-Type', 'text/event-stream');
	setResponseHeader(event, 'Cache-Control', 'no-cache');
	setResponseHeader(event, 'Connection', 'keep-alive');
	console.log('stream');
	const stream = createEventStream(event);

	// Add the client to the list of connected clients
	console.log('clients');
	clients.push(stream);
	console.log('listen up');
	stream.push('listen up folks');

	console.log('stream onclosed');
	// Handle client disconnection
	stream.onClosed(() => {
		clients = clients.filter((client) => client !== stream); // Remove the client when it disconnects
	});

	console.log('stream send');
	return stream.send();
});

// Function to update the backend data and notify all connected clients
export function updateLatestBackendData() {
	// latestBackendData = data;

	// Notify all connected clients about the new data
	clients.forEach((client) => {
		client.push('plzrefetch');
	});
}
