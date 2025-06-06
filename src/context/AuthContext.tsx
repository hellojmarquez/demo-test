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
	login: (userData: User) => void;
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
		const storedUser = localStorage.getItem('user');
		const storedCurrentAccount = localStorage.getItem('currentAccount');

		if (storedUser) {
			const parsedUser = JSON.parse(storedUser);
			setUser(parsedUser);
			setOriginalUser(parsedUser);

			// Si hay una cuenta guardada, usarla
			if (storedCurrentAccount) {
				const parsedAccount = JSON.parse(storedCurrentAccount);
				setCurrentAccount(parsedAccount);
			} else if (parsedUser.accounts && parsedUser.accounts.length > 0) {
				// Si no hay cuenta guardada, usar la primera
				setCurrentAccount(parsedUser.accounts[0]);
			}
		}
		setLoading(false);
	}, []);

	const login = (userData: User) => {
		setUser(userData);
		setOriginalUser(userData); // Guardar los datos originales
		localStorage.setItem('user', JSON.stringify(userData));
		if (userData.accounts && userData.accounts.length > 1) {
			setShowAccountSelector(true);
		} else if (userData.accounts && userData.accounts.length === 1) {
			selectAccount(userData.accounts[0]);
		}
	};

	const selectAccount = (account: Account) => {
		setCurrentAccount(account);

		// Guardar la cuenta seleccionada en localStorage
		localStorage.setItem('currentAccount', JSON.stringify(account));

		// Solo actualizar el user en localStorage si es la cuenta principal
		if (originalUser && account.type === 'principal') {
			const updatedUser = {
				...originalUser,
				role: account.role,
				name: account.name,
				email: account.email,
				picture: account.picture,
			};
			localStorage.setItem('user', JSON.stringify(updatedUser));
			setUser(updatedUser);
		} else {
			// Para subcuentas, solo actualizar el estado
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
		localStorage.removeItem('user');
		localStorage.removeItem('currentAccount');
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
