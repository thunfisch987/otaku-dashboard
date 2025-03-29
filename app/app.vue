<template>
	<div class="h-screen flex flex-col">
		<NuxtLoadingIndicator color="#E11D48" />
		<OtakuNav />
		<UApp>
			<USeparator />
			<NuxtPage />
		</UApp>
		<USeparator class="mt-auto" />
		<OtakuFooter />
	</div>
</template>
