<template>
	<UDropdownMenu :items="items">
		<UButton
			:title="`Logged in as: ${user?.name}`"
			variant="ghost"
		>
			<template #leading>
				<UAvatar
					:src="user?.image ?? undefined"
					:text="user?.name?.slice(0, 2).toUpperCase()"
					size="xl"
					crossorigin="anonymous"
					class="shrink-0"
				/>
			</template>
		</UButton>
	</UDropdownMenu>
</template>

<script setup lang="ts">
import type { AuthUser } from '#nuxt-better-auth';
import type { Passkey } from '@better-auth/passkey/client';
import type { DropdownMenuItem } from '@nuxt/ui';

const { user } = defineProps<{ user: AuthUser | null }>();

const toast = useToast();
const { client, signOut } = useUserSession();
const passkeyQuery = client?.useListPasskeys();
const registeredPasskeys = computed<Passkey[]>(
	() => passkeyQuery?.value.data ?? [],
);
const creatingPasskey = ref(false);
const deletingPasskeyId = ref<string | null>(null);

async function clearSession() {
	await signOut();
}

function showPasskeyError(error: unknown) {
	const message =
		error && typeof error === 'object' && 'message' in error
			? String(error.message)
			: 'The passkey operation could not be completed.';

	toast.add({
		title: 'Passkey error',
		description: message,
		color: 'error',
	});
}

async function createPasskey() {
	if (!client || creatingPasskey.value) return;

	creatingPasskey.value = true;
	try {
		const result = await client.passkey.addPasskey({
			name: `${user?.name ?? 'Otaku Dashboard'} passkey`,
		});

		if (result.error) {
			showPasskeyError(result.error);
			return;
		}

		toast.add({
			title: 'Passkey created',
			description: 'You can now use it to sign in to Otaku Dashboard.',
			color: 'success',
		});
	} catch (error) {
		showPasskeyError(error);
	} finally {
		creatingPasskey.value = false;
	}
}

async function deletePasskey(id: string) {
	if (!client || deletingPasskeyId.value) return;
	if (!window.confirm('Delete this passkey?')) return;

	deletingPasskeyId.value = id;
	try {
		const result = await client.$fetch('/passkey/delete-passkey', {
			method: 'POST',
			body: { id },
		});

		if (result.error) {
			showPasskeyError(result.error);
			return;
		}

		toast.add({
			title: 'Passkey deleted',
			color: 'success',
		});
	} catch (error) {
		showPasskeyError(error);
	} finally {
		deletingPasskeyId.value = null;
	}
}

const items = computed<DropdownMenuItem[]>(() => [
	{
		label: 'Passkeys',
		type: 'label',
	},
	{
		label: 'Create passkey',
		icon: 'i-lucide-fingerprint',
		loading: creatingPasskey.value,
		disabled: creatingPasskey.value,
		onSelect: () => {
			void createPasskey();
		},
	},
	...(registeredPasskeys.value.length > 0
		? registeredPasskeys.value.map((passkey) => ({
				label: `Delete ${passkey.name ?? 'unnamed passkey'}`,
				icon: 'i-lucide-trash-2',
				color: 'error' as const,
				loading: deletingPasskeyId.value === passkey.id,
				disabled:
					deletingPasskeyId.value !== null || creatingPasskey.value,
				onSelect: () => {
					void deletePasskey(passkey.id);
				},
			}))
		: [
				{
					label: 'No passkeys registered',
					disabled: true,
					icon: 'i-lucide-key-round',
				},
			]),
	{
		type: 'separator',
	},
	{
		label: 'Logout',
		icon: 'i-lucide-log-out',
		onSelect: () => {
			void clearSession();
		},
	},
]);
</script>
