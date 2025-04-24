'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SelloLogin() {
	const [user, setUser] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { login } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!password) {
			setError('Password is required.');
			return;
		}

		setLoading(true);
		setError(null); // Reset error state before request
		console.log(user, password);
		try {
			// Eliminar cookies existentes
			document.cookie =
				'loginToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
			document.cookie =
				'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
			document.cookie =
				'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

			const res = await fetch('/api/admin/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: user, password }),
			});

			setLoading(false);
			const data = await res.json();

			if (res.ok) {
				const userDB = data.userDB;

				const subAccounts = (userDB.subcuentas || [])
					.filter((sub: any) => sub.email !== userDB.email)
					.map((sub: any) => ({
						id: sub.email,
						name: sub.name,
						role: sub.role,
						type: sub.type,
						email: sub.email,
					}));

				const mainAccount = {
					id: userDB._id,
					name: userDB.name,
					role: userDB.role,
					type: userDB.type,
					email: userDB.email,
				};

				const userData = {
					name: userDB.name,
					email: userDB.email,
					role: userDB.role,
					accounts: [...subAccounts],
				};

				login(userData);
				router.push('/sello');
			} else {
				setError(data.error || 'Login failed. Please try again.');
			}
		} catch (err) {
			console.error(err);
			setLoading(false);
			setError('Unexpected error. Please try again.');
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
				<h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
					Login
				</h1>
				<form className="flex flex-col space-y-4">
					<label className="block text-sm font-medium text-gray-700">
						Usuario:
					</label>
					<input
						type="text"
						value={user}
						onChange={e => setUser(e.target.value)}
						className="w-full text-blue-400 border border-gray-300 rounded-md p-2"
						placeholder="Ingresa tu usuario"
					/>

					<label className="block text-sm font-medium text-gray-700">
						Contraseña:
					</label>

					<input
						type="password"
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
						placeholder="Enter your password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						disabled={loading}
					/>
					{error && <p className="text-red-500 text-sm text-center">{error}</p>}
					<button
						onClick={handleSubmit}
						className={`w-full py-2 text-white font-semibold rounded-lg ${
							loading
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-blue-500 hover:bg-blue-600'
						} focus:outline-none`}
						disabled={loading}
					>
						{loading ? 'Logging in...' : 'Login'}
					</button>
				</form>
			</div>
		</div>
	);
}
