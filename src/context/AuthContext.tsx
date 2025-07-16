'use client';
import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';
import { storage } from '@/lib/storage';

// Tipos para las cuentas
export type Account = {
	id: string;
	name: string;
	type: 'principal' | 'subcuenta';
	role: string;
	email: string;
	image?: string;
	picture?: string;
};

export type User = {
	_id: string;
	external_id?: string;
	name: string;
	role: string;
	email: string;
	accounts: Account[];
	picture?: string;
};

type AuthContextType = {
	user: User | null;
	originalUser: User | null; // Datos originales del usuario
	loading: boolean;
	currentAccount: Account | null;
	login: (userData: User) => Promise<void>;
	logout: () => void;
	selectAccount: (account: Account) => void;
	showAccountSelector: boolean;
	setShowAccountSelector: (show: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [originalUser, setOriginalUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
	const [showAccountSelector, setShowAccountSelector] = useState(false);

	useEffect(() => {
		const initializeAuth = () => {
			const storedUser = storage.get<User>('user');
			const storedCurrentAccount = storage.get<Account>('currentAccount');

			if (storedUser) {
				setUser(storedUser);
				setOriginalUser(storedUser);

				if (storedCurrentAccount) {
					setCurrentAccount(storedCurrentAccount);
				} else if (storedUser.accounts?.length > 0) {
					setCurrentAccount(storedUser.accounts[0]);
				}
			}
			setLoading(false);
		};

		initializeAuth();
	}, []);

	const login = async (userData: User) => {
		setUser(userData);
		setOriginalUser(userData);
		storage.set('user', userData);

		if (userData.accounts?.length > 1) {
			setShowAccountSelector(true);
		} else if (userData.accounts?.length === 1) {
			selectAccount(userData.accounts[0]);
		}
	};

	const selectAccount = (account: Account) => {
		setCurrentAccount(account);
		storage.set('currentAccount', account);

		if (originalUser && account.type === 'principal') {
			const updatedUser = {
				...originalUser,
				role: account.role,
				name: account.name,
				email: account.email,
				picture: account.picture,
			};
			storage.set('user', updatedUser);
			setUser(updatedUser);
		} else {
			setUser({
				...originalUser!,
				role: account.role,
				name: account.name,
				email: account.email,
				picture: account.picture,
			});
		}

		setShowAccountSelector(false);
	};

	const logout = () => {
		setUser(null);
		setOriginalUser(null);
		setCurrentAccount(null);
		storage.clear();
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				originalUser,
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
