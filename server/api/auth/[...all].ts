export default defineEventHandler((event) => {
	return authClient.handler(toWebRequest(event));
});
