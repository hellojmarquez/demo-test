// components/AccountSwitchButton.tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, User, ChevronDown, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountSwitchButton({
	onMenuClose,
}: {
	onMenuClose?: () => void;
}) {
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
				router.push('/panel/login');
			}
		} catch (error) {
			console.error('Error during logout:', error);
			// Aún si hay error, intentar redirigir
			router.push('/panel/login');
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
		<div
			className="flex flex-row gap-x-2 w-full relative items-center justify-center "
			ref={dropdownRef}
		>
			<span className="my-auto -mt-2 md:m-0">
				<a
					href="https://isla-sounds.zendesk.com/hc/en-us/requests/new"
					target="_blank"
				>
					<HelpCircle className=" text-white w-5 h-5" />
				</a>
			</span>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="text-sm bg-gray-50/10 hover:bg-gray-50/20 text-white p-2 rounded-full transition flex items-center  space-x-2 md:space-x-3"
			>
				<div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
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

				<span className="truncate max-w-[120px] md:max-w-[150px] font-medium hidden sm:block">
					{displayAccount.name}
				</span>
				<ChevronDown
					size={16}
					className={`transition-transform duration-200 ${
						isOpen ? 'rotate-180' : ''
					} hidden sm:block`}
				/>
			</button>
			{isOpen && (
				<div className="w-full relative sm:bg-white/95 sm:absolute sm:left-auto sm:-translate-x-8 sm:right-0 sm:top-3 sm:w-64 backdrop-blur-sm rounded-none sm:rounded-2xl shadow-none sm:shadow-2xl py-0 sm:py-3 border-0 sm:border border-gray-100/50 sm:translate-y-14">
					<div className="px-5 py-3 mb-2 hidden sm:block">
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

					<div className="px-0 sm:px-2">
						<button
							onClick={() => {
								setIsOpen(false);
								setShowAccountSelector(true);
								onMenuClose?.();
							}}
							className="w-full px-3 py-2.5 text-left text-sm text-white sm:text-gray-700 sm:hover:bg-gray-100/80 bg-transparent sm:bg-transparent rounded-none sm:rounded-lg flex items-center group transition-all duration-200"
						>
							<div className="w-8 h-8 rounded-lg bg-transparent sm:bg-blue-50 flex items-center justify-center mr-3 sm:group-hover:bg-blue-100 transition-colors">
								<User size={16} className="text-white sm:text-blue-600" />
							</div>
							Cambiar cuenta
						</button>

						<Link
							href="/panel/settings"
							onClick={() => {
								setIsOpen(false);
							}}
							className="w-full px-3 py-2.5 text-left text-sm text-white sm:text-gray-700 sm:hover:bg-gray-100/80 bg-transparent sm:bg-transparent rounded-none sm:rounded-lg flex items-center group transition-all duration-200"
						>
							<div className="w-8 h-8 rounded-lg bg-transparent sm:bg-purple-50 flex items-center justify-center mr-3 sm:group-hover:bg-purple-100 transition-colors">
								<Settings size={16} className="text-white sm:text-purple-600" />
							</div>
							Mi Cuenta
						</Link>

						<div className="h-px bg-gray-100/20 sm:bg-gray-100 my-2"></div>

						<button
							onClick={() => {
								setIsOpen(false);
								handleLogout();
							}}
							className="w-full px-3 py-2.5 text-left text-sm text-white sm:text-red-600 sm:hover:bg-red-50 bg-transparent sm:bg-transparent rounded-none sm:rounded-lg flex items-center group transition-all duration-200"
						>
							<div className="w-8 h-8 rounded-lg bg-transparent sm:bg-red-50 flex items-center justify-center mr-3 sm:group-hover:bg-red-100 transition-colors">
								<LogOut size={16} className="text-white sm:text-red-600" />
							</div>
							Cerrar sesión
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
