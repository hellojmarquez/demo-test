'use client';
import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';

// Tipos para las cuentas
export type Account = {
	id: string;
	name: string;
	type: 'admin' | 'sello' | 'subcuenta' | 'artista';
	role: string;
	email: string;
	image?: string;
	picture?: string;
};

export type User = {
	_id: string;
	name: string;
	role: string;
	email: string;
	accounts: Account[];
	picture?: string;
};

type AuthContextType = {
	user: User | null;
	loading: boolean;
	currentAccount: Account | null;
	login: (userData: User) => void;
	logout: () => void;
	selectAccount: (account: Account) => void;
	showAccountSelector: boolean;
	setShowAccountSelector: (show: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
	const [showAccountSelector, setShowAccountSelector] = useState(false);

	useEffect(() => {
		const storedUser = localStorage.getItem('user');
		const storedAccount = localStorage.getItem('currentAccount');
		if (storedUser) {
			const parsedUser = JSON.parse(storedUser);
			setUser(parsedUser);
			if (storedAccount) {
				setCurrentAccount(JSON.parse(storedAccount));
			} else if (parsedUser.accounts && parsedUser.accounts.length > 0) {
				setShowAccountSelector(true);
			}
		}
		console.log('user en auth provider', user);
		setLoading(false);
	}, []);

	const login = (userData: User) => {
		setUser(userData);
		localStorage.setItem('user', JSON.stringify(userData));
		if (userData.accounts && userData.accounts.length > 1) {
			setShowAccountSelector(true);
		} else if (userData.accounts && userData.accounts.length === 1) {
			selectAccount(userData.accounts[0]);
		}
	};

	const selectAccount = (account: Account) => {
		setCurrentAccount(account);
		localStorage.setItem('currentAccount', JSON.stringify(account));
		setShowAccountSelector(false);
	};

	const logout = () => {
		setUser(null);
		setCurrentAccount(null);
		localStorage.removeItem('user');
		localStorage.removeItem('currentAccount');
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				currentAccount,
				login,
				logout,
				selectAccount,
				showAccountSelector,
				setShowAccountSelector,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
