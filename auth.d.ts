declare module '#auth-utils' {
	interface User {
		name: string;
		given_name: string;
		family_name: string;
		avatar: string;
		email: string;
		id: string;
		webAuthn?: string;
	}
	interface UserSession {
		user: User;
		login_at: Date;
	}
}
