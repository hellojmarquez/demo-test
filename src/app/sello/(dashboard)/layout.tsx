// src/app/sello/(dashboard)/layout.tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import AccountSelector from '@/components/AccountSelector';
import AccountSwitchButton from '@/components/AccountSwitchButton';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
	Menu,
	X,
	Home,
	Users,
	MessageSquare,
	FileMusic,
	Settings,
	LogOut,
} from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const {
		user,
		loading,
		currentAccount,
		showAccountSelector,
		setShowAccountSelector,
	} = useAuth();

	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const pathname = usePathname();

	const isActive = (path: string) => {
		if (path === '/sello') {
			return pathname === path;
		}
		return pathname === path || pathname.startsWith(path + '/');
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				Cargando...
			</div>
		);
	}

	if (!user) {
		return null;
	}

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	return (
		<>
			<AccountSelector />
			<div className="min-h-screen ">
				{/* Header with Navigation */}
				<header className="bg-white shadow">
					<div className="max-w-7xl mx-auto">
						{/* Top Bar */}
						<div className="flex h-28 px-4 sm:px-6 lg:px-8 bg-brand-dark justify-between items-center py-4">
							<img src="/logo_white.png" alt="Isla Sounds" className="h-4" />
							<div className="flex items-center">
								<button
									onClick={toggleMobileMenu}
									className="md:hidden mr-4 text-gray-500 hover:text-gray-700"
								>
									{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
								</button>
								<h1 className="text-md text-white mb-4">
									Bienvenido {user?.name}{' '}
									{currentAccount &&
										` - ${currentAccount.name} (${currentAccount.type})`}
								</h1>
								<div className="flex items-center space-x-4">
									<AccountSwitchButton />
								</div>
							</div>
						</div>

						{/* Navigation Menu */}
						<nav
							className={`${
								mobileMenuOpen ? 'block' : 'hidden'
							} md:block border-t border-gray-200 `}
						>
							<div className="flex flex-col md:flex-row md:items-center md:space-x-4 py-2  px-4 sm:px-6 lg:px-8">
								<Link
									href="/sello"
									className={`flex items-center p-2 rounded-md transition-colors ${
										isActive('/sello')
											? 'bg-[#f0ecf1] text-[#0f4ccc]'
											: 'text-gray-700 hover:bg-[#f0ecf1] hover:text-[#0f4ccc]'
									}`}
									onClick={() => setMobileMenuOpen(false)}
								>
									<Home size={18} className="mr-2" />
									<span>Dashboard</span>
								</Link>
								<Link
									href="/sello/cuentas"
									className={`flex items-center p-2 rounded-md transition-colors ${
										isActive('/sello/cuentas')
											? 'bg-[#f0ecf1] text-[#0f4ccc]'
											: 'text-gray-700 hover:bg-[#f0ecf1] hover:text-[#0f4ccc]'
									}`}
									onClick={() => setMobileMenuOpen(false)}
								>
									<Users size={18} className="mr-2" />
									<span>Usuarios</span>
								</Link>
								<a
									href="/admin/mensajes"
									className={`flex items-center p-2 rounded-md transition-colors ${
										isActive('/admin/mensajes')
											? 'bg-[#f0ecf1] text-[#0f4ccc]'
											: 'text-gray-700 hover:bg-[#f0ecf1] hover:text-[#0f4ccc]'
									}`}
									onClick={() => setMobileMenuOpen(false)}
								>
									<MessageSquare size={18} className="mr-2" />
									<span>Mensajes</span>
								</a>
								<Link
									href="/sello/catalogo"
									className={`flex items-center p-2 rounded-md transition-colors ${
										isActive('/sello/catalogo')
											? 'bg-[#f0ecf1] text-[#0f4ccc]'
											: 'text-gray-700 hover:bg-[#f0ecf1] hover:text-[#0f4ccc]'
									}`}
									onClick={() => setMobileMenuOpen(false)}
								>
									<FileMusic size={18} className="mr-2" />
									<span>Catálogo</span>
								</Link>
								<a
									href="/admin/config"
									className={`flex items-center p-2 rounded-md transition-colors ${
										isActive('/admin/config')
											? 'bg-[#f0ecf1] text-[#0f4ccc]'
											: 'text-gray-700 hover:bg-[#f0ecf1] hover:text-[#0f4ccc]'
									}`}
									onClick={() => setMobileMenuOpen(false)}
								>
									<Settings size={18} className="mr-2" />
									<span>Configuraciones</span>
								</a>
								<button
									onClick={() => {
										document.cookie =
											'session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
										window.location.href = 'https://login.islasounds.com';
									}}
									className="flex items-center p-2 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors text-gray-700"
								>
									<LogOut size={18} className="mr-2" />
									<span>Cerrar sesión</span>
								</button>
							</div>
						</nav>
					</div>
				</header>

				{/* Main Content */}
				<main
					className={`${inter.className} bg-white text-gray-900 min-h-screen  md:p-8`}
				>
					<div className="max-w-7xl mx-auto">{children}</div>
				</main>
			</div>
		</>
	);
}
