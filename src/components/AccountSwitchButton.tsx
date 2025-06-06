// components/AccountSwitchButton.tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountSwitchButton() {
	const { user, currentAccount, setShowAccountSelector, logout } = useAuth();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	if (!user) return null;

	// Crear una cuenta principal si no hay cuenta actual
	const displayAccount = currentAccount || {
		id: user.email,
		name: user.name,
		role: user.role,
		type: 'sello' as const,
		email: user.email,
		picture: user.picture,
	};

	// Obtener la primera letra del nombre para el fallback
	const initial = displayAccount.name.charAt(0).toUpperCase();

	// Determinar si la imagen es base64 o URL
	const getImageSrc = (): string => {
		if (!displayAccount.picture) {
			return '';
		}

		// Si es un string que comienza con data:image
		if (
			displayAccount.picture.startsWith('http') ||
			displayAccount.picture.startsWith('data:image')
		) {
			return displayAccount.picture;
		}

		return `data:image/png;base64,${displayAccount.picture}`;
	};

	const imageSrc = getImageSrc();

	const handleLogout = async () => {
		try {
			// Primero ejecutar el logout del contexto
			logout();

			// Limpiar nextauth.message
			localStorage.removeItem('nextauth.message');

			// Luego hacer la llamada al API
			const response = await fetch('/api/auth/logout', {
				method: 'POST',
			});

			if (response.ok) {
				// Redirigir al login
				router.push('/sello/login');
			}
		} catch (error) {
			console.error('Error during logout:', error);
			// Aún si hay error, intentar redirigir
			router.push('/sello/login');
		}
	};

	// Cerrar el menú cuando se hace clic fuera
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="text-sm bg-gray-50/10 hover:bg-gray-50/20 text-white p-2 rounded-full transition flex items-center space-x-2"
			>
				<div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
					{imageSrc ? (
						<Image
							src={imageSrc}
							alt={displayAccount.name}
							fill
							className="object-cover"
						/>
					) : (
						<span className="text-sm font-medium text-gray-600">{initial}</span>
					)}
				</div>
				<span className="truncate max-w-[120px] font-medium">
					{displayAccount.name}
				</span>
				<ChevronDown
					size={16}
					className={`transition-transform duration-200 ${
						isOpen ? 'rotate-180' : ''
					}`}
				/>
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl py-3 z-50 border border-gray-100/50">
					<div className="px-5 py-3 mb-2">
						<div className="flex items-center space-x-3">
							<div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
								{imageSrc ? (
									<Image
										src={imageSrc}
										alt={displayAccount.name}
										fill
										className="object-cover"
									/>
								) : (
									<span className="text-sm font-medium text-gray-600">
										{initial}
									</span>
								)}
							</div>
							<div>
								<p className="text-sm font-semibold text-gray-900">
									{displayAccount.name}
								</p>
								<p className="text-xs text-gray-500">{displayAccount.email}</p>
							</div>
						</div>
					</div>

					<div className="px-2">
						<button
							onClick={() => {
								setIsOpen(false);
								setShowAccountSelector(true);
							}}
							className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100/80 rounded-lg flex items-center group transition-all duration-200"
						>
							<div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
								<User size={16} className="text-blue-600" />
							</div>
							Cambiar cuenta
						</button>

						<Link
							href="/sello/settings"
							onClick={() => {
								setIsOpen(false);
							}}
							className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100/80 rounded-lg flex items-center group transition-all duration-200"
						>
							<div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mr-3 group-hover:bg-purple-100 transition-colors">
								<Settings size={16} className="text-purple-600" />
							</div>
							Mi Cuenta
						</Link>

						<div className="h-px bg-gray-100 my-2"></div>

						<button
							onClick={() => {
								setIsOpen(false);
								handleLogout();
							}}
							className="w-full px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center group transition-all duration-200"
						>
							<div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-3 group-hover:bg-red-100 transition-colors">
								<LogOut size={16} className="text-red-600" />
							</div>
							Cerrar sesión
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
