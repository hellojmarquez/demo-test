// components/AccountSelector.tsx
'use client';
import { useAuth } from '@/context/AuthContext';

export default function AccountSelector() {
	const { user, selectAccount, showAccountSelector } = useAuth();

	if (!showAccountSelector || !user?.accounts) return null;

	// Crear una cuenta principal a partir del usuario principal
	const mainAccount = {
		id: user.email, // usando email como ID única
		name: user.name,
		role: user.role,
		type: 'sello' as const,
		email: user.email,
	};

	// Combinar cuenta principal con las demás cuentas
	const allAccounts = [mainAccount, ...user.accounts];

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
				<h2 className="text-xl font-bold mb-4">Selecciona una cuenta</h2>
				<div className="space-y-2">
					{allAccounts.map(account => (
						<button
							key={account.id}
							onClick={() => selectAccount(account)}
							className="w-full text-left p-3 rounded hover:bg-blue-50 border flex justify-between items-center"
						>
							<div>
								<div className=" text-gray-500 font-medium">{account.name}</div>
								<div className="text-sm text-gray-500">Rol: {account.role}</div>
							</div>
							<span className="text-xs text-blue-400 bg-blue-100 px-2 py-1 rounded">
								{account.type}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
