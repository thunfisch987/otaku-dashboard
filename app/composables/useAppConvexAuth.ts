export function useAppConvexAuth() {
	return {
		isLoading: useState('appConvexAuthLoading', () => true),
		isAuthenticated: useState('appConvexAuthenticated', () => false),
	};
}
