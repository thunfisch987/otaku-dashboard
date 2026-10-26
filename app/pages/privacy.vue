<template>
	<main class="container mx-auto max-w-3xl px-4 py-10 text-sm leading-6">
		<h1 class="mb-2 text-3xl font-semibold">Privacy policy</h1>
		<p class="mb-8 text-muted">Last updated: October 25, 2026</p>

		<UAlert
			color="warning"
			variant="subtle"
			icon="i-lucide-triangle-alert"
			title="Complete the controller details before publishing"
			description="Replace the bracketed organization and contact details, confirm the legal bases and retention periods, and check the hosting regions configured for your deployments."
			class="mb-8"
		/>

		<section class="space-y-3">
			<h2 class="text-xl font-semibold">Who is responsible?</h2>
			<p>
				The controller is
				<strong>[legal name of the organization]</strong>, at
				<strong>[postal address]</strong>. For privacy questions or data
				requests, contact <strong>[privacy contact email]</strong>. If
				the organization has appointed a data protection officer, add
				their contact details here:
				<strong>[DPO contact, if applicable]</strong>.
			</p>
		</section>

		<section class="mt-8 space-y-3">
			<h2 class="text-xl font-semibold">What data the app stores</h2>
			<ul class="list-disc space-y-2 pl-6">
				<li>
					<strong>Account and sign-in data:</strong> name, email
					address, profile image, authentication sessions, passkey
					credential metadata, and (when enabled) Google sign-in
					tokens. Session records may also contain the connecting IP
					address and browser user-agent.
				</li>
				<li>
					<strong>Cached profile image:</strong> after sign-in, the
					server copies the Google profile image into Convex file
					storage. The app then serves the cached copy; it shows
					initials while the copy is being prepared.
				</li>
				<li>
					<strong>Event records:</strong> product names, suppliers,
					prices, stock quantities, order names or labels, quantities,
					and inventory transaction history, including the operator
					account and timestamps associated with changes. Free-text
					order labels could contain personal data if an operator
					enters it.
				</li>
			</ul>
			<p>
				The app is intended for event operators. Avoid putting attendee
				or customer details into order labels unless needed for the
				event.
			</p>
		</section>

		<section class="mt-8 space-y-3">
			<h2 class="text-xl font-semibold">Why data is used</h2>
			<p>
				The organization uses account data to sign operators in and
				identify who made a change, and uses event records to manage
				inventory and review stock and money movements. The organization
				must confirm and state the applicable legal basis for these
				purposes before publishing this policy:
				<strong>[confirmed GDPR legal basis]</strong>.
			</p>
		</section>

		<section class="mt-8 space-y-3">
			<h2 class="text-xl font-semibold">Service providers</h2>
			<p>
				The app uses Convex for its database, authentication records,
				and file storage, and Vercel for application hosting. Google is
				used as a sign-in provider when enabled; Google supplies the
				profile image that the server copies into the app's storage.
				These providers process data to deliver their services. The
				organization should confirm the configured hosting regions and
				any applicable international data transfers here:
				<strong>[deployment and transfer details]</strong>.
			</p>
		</section>

		<section class="mt-8 space-y-3">
			<h2 class="text-xl font-semibold">Retention</h2>
			<p>
				Account and profile data is kept while an operator account is in
				use. Event and transaction records are kept for as long as the
				organization needs them for event operations and applicable
				recordkeeping duties. No automatic retention period is
				configured in the app, so the organization should set and
				publish its retention periods. Cached profile images are
				retained with the associated account data.
			</p>
		</section>

		<section class="mt-8 space-y-3">
			<h2 class="text-xl font-semibold">Your choices and rights</h2>
			<p>
				Depending on the applicable law, you may ask the controller for
				access to, correction of, or deletion of your personal data, or
				ask to restrict or object to its processing. Contact the
				organization using the details above. You may also complain to
				your local data protection supervisory authority. Sign-in
				through Google can be managed through your Google account;
				deleting a Google account does not itself delete records already
				held by this app. Where applicable, you may also request data
				portability or withdraw consent for processing based on consent.
			</p>
		</section>

		<section class="mt-8 space-y-3">
			<h2 class="text-xl font-semibold">
				Cookies and automated decisions
			</h2>
			<p>
				The app uses authentication session cookies to keep operators
				signed in. It does not make decisions about people solely by
				automated processing or profiling.
			</p>
		</section>
	</main>
</template>

<script setup lang="ts">
useHead({
	title: 'Privacy policy · Otaku Dashboard',
	meta: [
		{
			name: 'description',
			content: 'Information about personal data used by Otaku Dashboard.',
		},
	],
});
</script>
