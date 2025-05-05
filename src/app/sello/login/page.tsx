'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, Lock, Music } from 'lucide-react';

export default function SelloLogin() {
	const [user, setUser] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [isUserFocused, setIsUserFocused] = useState(false);
	const [isPasswordFocused, setIsPasswordFocused] = useState(false);
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
		<>
			<style jsx global>{`
				@keyframes wave {
					0%,
					100% {
						transform: scaleY(0.1);
					}
					50% {
						transform: scaleY(1);
					}
				}
				.animate-wave {
					animation: wave 1s ease-in-out infinite;
					transform-origin: bottom;
				}
			`}</style>
			<div className="min-h-screen flex items-center justify-center bg-gray-100">
				<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
					<h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
						Isla Sounds
					</h1>
					<form className="flex flex-col space-y-4">
						<div className="relative">
							<User
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600"
								size={20}
							/>
							<label
								className={`absolute left-10 transition-all duration-200 ${
									isUserFocused || user
										? 'top-1 text-xs text-gray-600'
										: 'top-1/2 -translate-y-1/2 text-gray-400'
								}`}
							>
								Usuario
							</label>
							<input
								type="text"
								value={user}
								onChange={e => setUser(e.target.value)}
								onFocus={() => setIsUserFocused(true)}
								onBlur={() => setIsUserFocused(false)}
								className="w-full pl-10 pr-4 pt-4 pb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
							/>
						</div>
						<div className="relative">
							<Lock
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600"
								size={20}
							/>
							<label
								className={`absolute left-10 transition-all duration-200 ${
									isPasswordFocused || password
										? 'top-1 text-xs text-gray-600'
										: 'top-1/2 -translate-y-1/2 text-gray-400'
								}`}
							>
								Contraseña
							</label>
							<input
								type="password"
								value={password}
								onChange={e => setPassword(e.target.value)}
								onFocus={() => setIsPasswordFocused(true)}
								onBlur={() => setIsPasswordFocused(false)}
								className="w-full pl-10 pr-4 pt-4 pb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
								disabled={loading}
							/>
						</div>
						{error && (
							<p className="text-red-500 text-sm text-center">{error}</p>
						)}
						<button
							onClick={handleSubmit}
							className={`w-full py-3 text-white font-semibold rounded-lg relative overflow-hidden group ${
								loading
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
							} focus:outline-none transition-all duration-300`}
							disabled={loading}
						>
							{loading ? (
								<div className="flex items-center justify-center h-6">
									<div className="flex space-x-1 items-end">
										<div
											className="w-1 h-4 bg-white rounded-full animate-wave"
											style={{ animationDelay: '0ms' }}
										></div>
										<div
											className="w-1 h-4 bg-white rounded-full animate-wave"
											style={{ animationDelay: '150ms' }}
										></div>
										<div
											className="w-1 h-4 bg-white rounded-full animate-wave"
											style={{ animationDelay: '300ms' }}
										></div>
										<div
											className="w-1 h-4 bg-white rounded-full animate-wave"
											style={{ animationDelay: '450ms' }}
										></div>
										<div
											className="w-1 h-4 bg-white rounded-full animate-wave"
											style={{ animationDelay: '600ms' }}
										></div>
									</div>
								</div>
							) : (
								<div className="flex items-center justify-center space-x-2">
									<Music className="w-5 h-5" />
									<span>Login</span>
								</div>
							)}
						</button>
					</form>
				</div>
			</div>
		</>
	);
}
