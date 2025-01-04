declare module '#auth-utils' {
	interface User {
		name: string;
		given_name: string;
		family_name: string;
		avatar: string;
		email: string;
	}
	interface UserSession {
		user: {
			name: string;
			given_name: string;
			family_name: string;
			avatar: string;
			email: string;
		};
	}
}
