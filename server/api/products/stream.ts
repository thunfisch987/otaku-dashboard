let clients = [];
// let latestBackendData = 'Waiting for backend check...';

export default defineEventHandler(async (event) => {
	setResponseHeader(event, 'Content-Type', 'text/event-stream');
	setResponseHeader(event, 'Cache-Control', 'no-cache');
	setResponseHeader(event, 'Connection', 'keep-alive');
	const stream = createEventStream(event);

	// Add the client to the list of connected clients
	clients.push(stream);
	stream.push('listen up folks');

	// Handle client disconnection
	stream.onClosed(() => {
		clients = clients.filter((client) => client !== stream); // Remove the client when it disconnects
	});

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
