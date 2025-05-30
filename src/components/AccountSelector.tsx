// components/AccountSelector.tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface SubAccount {
	_id: string;
	name: string;
	email: string;
	role: string;
	status: string;
	picture?: string;
}

interface Account {
	id: string;
	name: string;
	role: string;
	type: 'principal' | 'subcuenta';
	email: string;
	status?: string;
	picture?: string;
}

export default function AccountSelector() {
	const {
		originalUser,
		selectAccount,
		showAccountSelector,
		setShowAccountSelector,
	} = useAuth();
	const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchSubAccounts = async () => {
			if (originalUser?._id) {
				try {
					const response = await fetch(
						`/api/admin/getUserRelations/${originalUser._id}`
					);
					if (!response.ok) throw new Error('Error al obtener relaciones');
					const data = await response.json();
					setSubAccounts(data.data.subAccounts || []);
				} catch (error) {
					console.error('Error al obtener subcuentas:', error);
				} finally {
					setIsLoading(false);
				}
			}
		};

		fetchSubAccounts();
	}, [originalUser?._id]);

	if (!showAccountSelector || !originalUser) return null;

	// Crear una cuenta principal a partir del usuario original
	const mainAccount: Account = {
		id: originalUser._id,
		name: originalUser.name,
		role: originalUser.role,
		type: 'principal',
		email: originalUser.email,
		picture: originalUser.picture || undefined,
	};

	// Combinar cuenta principal con las subcuentas
	const allAccounts: Account[] = [
		mainAccount,
		...subAccounts.map(account => ({
			id: account._id,
			name: account.name,
			role: account.role,
			type: 'subcuenta' as const,
			email: account.email,
			status: account.status,
			picture: account.picture || undefined,
		})),
	];

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
				<button
					onClick={() => setShowAccountSelector(false)}
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
				>
					<X size={20} />
				</button>
				<h2 className="text-xl font-bold mb-4">Selecciona una cuenta</h2>
				{isLoading ? (
					<div className="text-center py-4">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
						<p className="text-sm text-gray-500 mt-2">Cargando cuentas...</p>
					</div>
				) : (
					<div className="space-y-2">
						{allAccounts.map(account => (
							<button
								key={account.id}
								onClick={() => selectAccount(account)}
								className="w-full text-left p-3 rounded hover:bg-blue-50 border flex justify-between items-center"
							>
								<div>
									<div className="text-gray-900 font-medium">
										{account.name}
									</div>
									<div className="text-sm text-gray-500">
										{account.email} • {account.role}
									</div>
								</div>
								<div className="flex items-center space-x-2">
									{account.status && (
										<span
											className={`text-xs px-2 py-1 rounded ${
												account.status === 'activo'
													? 'text-green-800 bg-green-100'
													: 'text-red-800 bg-red-100'
											}`}
										>
											{account.status}
										</span>
									)}
									<span className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded">
										{account.type}
									</span>
								</div>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
