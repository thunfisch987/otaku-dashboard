export default defineNuxtPlugin(async (nuxtApp) => {
	// nuxtApp.hook("app:created", async () => {
	await useUserSession().fetch();
	// });
});
