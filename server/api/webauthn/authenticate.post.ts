import type { User } from '#auth-utils';
import type { H3Event } from 'h3';
import type { InsertPasskey } from '~~/server/utils/drizzle';

export default defineWebAuthnAuthenticateEventHandler({
	async getCredential(event: H3Event, credentialId: string) {
		const rows = await useDrizzle()
			.select()
			.from(tables.passkeys)
			.where(eq(tables.passkeys.id, credentialId));
	},
	async onSuccess(
		event: H3Event,
		{
			credential,
			authenticationInfo,
		}: {
			credential: InsertPasskey;
			authenticationInfo: Record<string, string> & { newCounter: number };
		},
	) {
		const rows = useDrizzle()
			.select()
			.from(tables.passkeys)
			.innerJoin(
				tables.users,
				eq(tables.passkeys.userId, tables.users.id),
			)
			.where(eq(tables.passkeys.id, credential.id));
		await useDrizzle()
			.update(tables.passkeys)
			.set({ counter: authenticationInfo.newCounter })
			.where(eq(tables.passkeys.id, credential.id));
	},
});
