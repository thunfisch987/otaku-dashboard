declare module '#auth-utils' {
	interface User {
		sub: string;
		name: string;
		given_name: string;
		family_name: string;
		avatar: string;
		email: string;
		email_verified: boolean;
		tokens: {
			// access_token: string;
			expires_in: number;
			scope: string;
			token_type: string;
			id_token: string;
			// refresh_token: string;
			expires_at: number;
		};
		login_methods: {
			osu?: boolean;
			google?: boolean;
		};
	}

	interface UserSession {
		login_at: Date;
	}

	interface SecureSessionData {
		access_token: string;
		refresh_token?: string;
	}
}

export {};
