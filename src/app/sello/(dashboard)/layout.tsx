// src/app/sello/(dashboard)/layout.tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import AccountSelector from '@/components/AccountSelector';
import AccountSwitchButton from '@/components/AccountSwitchButton';
import { Inter } from 'next/font/google';
import Link from 'next/link';
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
			<div className="min-h-screen bg-gray-50">
				<header className="bg-white shadow">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
						<div className="flex items-center">
							<button
								onClick={toggleMobileMenu}
								className="md:hidden mr-4 text-gray-500 hover:text-gray-700"
							>
								{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
							</button>
							<h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
						</div>
						<div className="flex items-center space-x-4">
							<AccountSwitchButton />
						</div>
					</div>
				</header>
				<div
					className={`${inter.className} bg-[#f0ecf1] text-gray-900 min-h-screen flex`}
				>
					{/* Mobile Menu Overlay */}
					{mobileMenuOpen && (
						<div
							className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
							onClick={toggleMobileMenu}
						></div>
					)}

					{/* Sidebar */}
					<aside
						className={`fixed md:static w-64 bg-white shadow-md p-4 z-30 transition-transform duration-300 ease-in-out ${
							mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
						} md:translate-x-0 min-h-full overflow-y-auto`}
					>
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-[#0f4ccc] font-semibold text-lg">
								{user.name} {user.role}
							</h2>
							<button
								onClick={toggleMobileMenu}
								className="md:hidden text-gray-500 hover:text-gray-700"
							>
								<X size={20} />
							</button>
						</div>
						<nav className="space-y-1">
							<Link
								href="/sello"
								className="flex items-center p-2 rounded-md hover:bg-[#f0ecf1] hover:text-[#0f4ccc] transition-colors"
								onClick={() => setMobileMenuOpen(false)}
							>
								<Home size={18} className="mr-3" />
								<span>Dashboard</span>
							</Link>
							<Link
								href="/sello/cuentas"
								className="flex items-center p-2 rounded-md hover:bg-[#f0ecf1] hover:text-[#0f4ccc] transition-colors"
								onClick={() => setMobileMenuOpen(false)}
							>
								<Users size={18} className="mr-3" />
								<span>Usuarios</span>
							</Link>
							<a
								href="/admin/mensajes"
								className="flex items-center p-2 rounded-md hover:bg-[#f0ecf1] hover:text-[#0f4ccc] transition-colors"
								onClick={() => setMobileMenuOpen(false)}
							>
								<MessageSquare size={18} className="mr-3" />
								<span>Mensajes</span>
							</a>
							<Link
								href="/sello/catalogo"
								className="flex items-center p-2 rounded-md hover:bg-[#f0ecf1] hover:text-[#0f4ccc] transition-colors"
								onClick={() => setMobileMenuOpen(false)}
							>
								<FileMusic size={18} className="mr-3" />
								<span>Catálogo</span>
							</Link>
							<a
								href="/admin/config"
								className="flex items-center p-2 rounded-md hover:bg-[#f0ecf1] hover:text-[#0f4ccc] transition-colors"
								onClick={() => setMobileMenuOpen(false)}
							>
								<Settings size={18} className="mr-3" />
								<span>Configuraciones</span>
							</a>
							<button
								onClick={() => {
									document.cookie =
										'session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
									window.location.href = 'https://login.islasounds.com';
								}}
								className="flex items-center p-2 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
							>
								<LogOut size={18} className="mr-3" />
								<span>Cerrar sesión</span>
							</button>
						</nav>
					</aside>
					<main className="flex-1 p-4 md:p-8 bg-[#f0ecf1]">
						<header className="flex justify-between items-center mb-4">
							<h1 className="text-2xl font-bold text-[#0f4ccc]">
								Bienvenido {user?.name}{' '}
								{currentAccount &&
									` - ${currentAccount.name} (${currentAccount.type})`}
							</h1>
						</header>
						{children}
					</main>
				</div>
			</div>
		</>
	);
}
