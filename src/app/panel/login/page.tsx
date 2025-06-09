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
				const userDB = data.user;

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
					_id: userDB._id,
					name: userDB.name,
					email: userDB.email,
					role: userDB.role,
					accounts: [...subAccounts],
					picture: userDB.picture,
				};

				login(userData);
				router.push('/panel');
			} else {
				// Si el usuario está baneado, redirigir a la página de baneo
				if (data.error === 'banneado') {
					router.push('/panel/banned');
					return;
				}
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
				@keyframes wave1 {
					0%,
					100% {
						transform: scaleY(0.2);
					}
					25% {
						transform: scaleY(0.8);
					}
					50% {
						transform: scaleY(0.3);
					}
					75% {
						transform: scaleY(0.9);
					}
				}
				@keyframes wave2 {
					0%,
					100% {
						transform: scaleY(0.9);
					}
					25% {
						transform: scaleY(0.3);
					}
					50% {
						transform: scaleY(0.8);
					}
					75% {
						transform: scaleY(0.2);
					}
				}
				@keyframes wave3 {
					0%,
					100% {
						transform: scaleY(0.4);
					}
					25% {
						transform: scaleY(0.7);
					}
					50% {
						transform: scaleY(0.2);
					}
					75% {
						transform: scaleY(0.6);
					}
				}
				@keyframes wave4 {
					0%,
					100% {
						transform: scaleY(0.7);
					}
					25% {
						transform: scaleY(0.2);
					}
					50% {
						transform: scaleY(0.5);
					}
					75% {
						transform: scaleY(0.3);
					}
				}
				@keyframes wave5 {
					0%,
					100% {
						transform: scaleY(0.3);
					}
					25% {
						transform: scaleY(0.6);
					}
					50% {
						transform: scaleY(0.9);
					}
					75% {
						transform: scaleY(0.4);
					}
				}
				.animate-wave1 {
					animation: wave1 0.8s ease-in-out infinite;
					transform-origin: bottom;
				}
				.animate-wave2 {
					animation: wave2 1.2s ease-in-out infinite;
					transform-origin: bottom;
				}
				.animate-wave3 {
					animation: wave3 0.9s ease-in-out infinite;
					transform-origin: bottom;
				}
				.animate-wave4 {
					animation: wave4 1.1s ease-in-out infinite;
					transform-origin: bottom;
				}
				.animate-wave5 {
					animation: wave5 1s ease-in-out infinite;
					transform-origin: bottom;
				}
			`}</style>
			<div className="min-h-screen flex items-center justify-center bg-gray-100">
				<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
					<img
						src="/isla_sounds_logo.png"
						alt="Isla Sounds"
						className="w-8/12 mx-auto mb-6"
					/>
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
								className="w-full pl-10 pr-4 pt-4 pb-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent text-black"
							/>
						</div>
						<div className="relative">
							<Lock
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
								className="w-full pl-10 pr-4 pt-4 pb-2 border-b-2 border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent text-black"
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
										<div className="w-1 h-4 bg-white rounded-full animate-wave1"></div>
										<div className="w-1 h-4 bg-white rounded-full animate-wave2"></div>
										<div className="w-1 h-4 bg-white rounded-full animate-wave3"></div>
										<div className="w-1 h-4 bg-white rounded-full animate-wave4"></div>
										<div className="w-1 h-4 bg-white rounded-full animate-wave5"></div>
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
