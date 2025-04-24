// components/AccountSwitchButton.tsx
'use client';
import { useAuth } from '@/context/AuthContext';

export default function AccountSwitchButton() {
	const { user, currentAccount, setShowAccountSelector } = useAuth();

	// Si el usuario no tiene múltiples cuentas, no mostrar el botón
	if (!user?.accounts || user.accounts.length <= 1) {
		return null;
	}

	return (
		<button
			onClick={() => setShowAccountSelector(true)}
			className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-md transition flex items-center"
		>
			{currentAccount ? (
				<>
					<span className="truncate max-w-[120px]">{currentAccount.name}</span>
					<span className="ml-1 text-xs bg-blue-100 px-1 rounded">
						{currentAccount.type}
					</span>
				</>
			) : (
				'Seleccionar cuenta'
			)}
		</button>
	);
}
