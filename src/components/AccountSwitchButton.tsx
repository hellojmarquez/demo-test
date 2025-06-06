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
		if (displayAccount.picture.startsWith('data:image')) {
			return displayAccount.picture;
		}

		// Si es un string base64 sin el prefijo data:image
		if (displayAccount.picture.startsWith('iVBORw0KGgo')) {
			return `data:image/png;base64,${displayAccount.picture}`;
		}

		// Si es una URL
		return displayAccount.picture;
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
				<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
					<div className="px-4 py-2 border-b border-gray-100">
						<p className="text-sm font-medium text-gray-900">
							{displayAccount.name}
						</p>
						<p className="text-xs text-gray-500">{displayAccount.email}</p>
					</div>

					<button
						onClick={() => {
							setIsOpen(false);
							setShowAccountSelector(true);
						}}
						className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
					>
						<User size={16} className="mr-2" />
						Cambiar cuenta
					</button>

					<Link
						href="/sello/settings"
						onClick={() => {
							setIsOpen(false);
						}}
						className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
					>
						<Settings size={16} className="mr-2" />
						Mi Cuenta
					</Link>

					<button
						onClick={() => {
							setIsOpen(false);
							handleLogout();
						}}
						className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center"
					>
						<LogOut size={16} className="mr-2" />
						Cerrar sesión
					</button>
				</div>
			)}
		</div>
	);
}
