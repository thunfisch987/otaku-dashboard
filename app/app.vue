<template>
	<div class="h-screen flex flex-col">
		<NuxtLoadingIndicator color="#E11D48" />
		<UApp>
			<OtakuNav />
			<USeparator />
			<NuxtPage />
		</UApp>
		<USeparator class="mt-auto" />
		<OtakuFooter />
	</div>
</template>
