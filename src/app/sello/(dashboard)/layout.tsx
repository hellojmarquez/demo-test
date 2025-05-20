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
			return pathname?.toString() === path;
		}
		return (
			pathname?.toString() === path ||
			pathname?.toString().startsWith(path + '/')
		);
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
						<div className="flex bg-brand-dark justify-between md:justify-start px-6 items-center md:space-x-10 py-4">
							<div className="flex items-center">
								<img src="/logo_white.png" alt="Isla Sounds" className="h-3" />
							</div>

							{/* Mobile menu button */}
							<button
								onClick={toggleMobileMenu}
								className="md:hidden text-white p-2"
								aria-label="Toggle menu"
							>
								{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
							</button>

							{/* Desktop Navigation */}
							<nav className="hidden md:block">
								<div className="flex items-center space-x-4">
									<Link
										href="/sello"
										className={`flex items-center p-2 transition-colors relative group ${
											isActive('/sello')
												? 'text-white border-b-2'
												: 'text-white'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										<Home size={18} className="mr-2" />
										<span>Dashboard</span>
										<span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
									</Link>
									<Link
										href="/sello/cuentas"
										className={`flex items-center p-2 transition-colors relative group ${
											isActive('/sello/cuentas')
												? 'text-white border-b-2'
												: 'text-white'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										<Users size={18} className="mr-2" />
										<span>Usuarios</span>
										<span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
									</Link>
									<Link
										href="/sello/mensajes"
										className={`flex items-center p-2 transition-colors relative group ${
											isActive('/sello/mensajes')
												? 'text-white border-b-2'
												: 'text-white'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										<MessageSquare size={18} className="mr-2" />
										<span>Mensajes</span>
										<span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
									</Link>
									<Link
										href="/sello/catalogo"
										className={`flex items-center p-2 transition-colors relative group ${
											isActive('/sello/catalogo')
												? 'text-white border-b-2'
												: 'text-white'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										<FileMusic size={18} className="mr-2" />
										<span>Catálogo</span>
										<span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
									</Link>
									<a
										href="/admin/config"
										className={`flex items-center p-2 transition-colors relative group ${
											isActive('/admin/config')
												? 'text-white border-b-2'
												: 'text-white'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										<Settings size={18} className="mr-2" />
										<span>Configuraciones</span>
										<span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
									</a>
								</div>
							</nav>

							{/* Mobile Navigation */}
							<nav
								className={`${
									mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
								} md:hidden fixed top-0 left-0 h-full w-64 bg-brand-dark shadow-lg z-50 transition-transform duration-300 ease-in-out`}
							>
								<div className="flex flex-col h-full">
									<div className="flex justify-end p-4">
										<button
											onClick={toggleMobileMenu}
											className="text-white p-2"
											aria-label="Close menu"
										>
											<X size={24} />
										</button>
									</div>
									<div className="flex flex-col px-4 py-2">
										<Link
											href="/sello"
											className={`flex items-center p-3 transition-colors relative group ${
												isActive('/sello')
													? 'text-white border-l-2 border-white'
													: 'text-white'
											}`}
											onClick={() => setMobileMenuOpen(false)}
										>
											<Home size={18} className="mr-2" />
											<span>Dashboard</span>
										</Link>
										<Link
											href="/sello/cuentas"
											className={`flex items-center p-3 transition-colors relative group ${
												isActive('/sello/cuentas')
													? 'text-white border-l-2 border-white'
													: 'text-white'
											}`}
											onClick={() => setMobileMenuOpen(false)}
										>
											<Users size={18} className="mr-2" />
											<span>Usuarios</span>
										</Link>
										<a
											href="/sello/mensajes"
											className={`flex items-center p-3 transition-colors relative group ${
												isActive('/sello/mensajes')
													? 'text-white border-l-2 border-white'
													: 'text-white'
											}`}
											onClick={() => setMobileMenuOpen(false)}
										>
											<MessageSquare size={18} className="mr-2" />
											<span>Mensajes</span>
										</a>
										<Link
											href="/sello/catalogo"
											className={`flex items-center p-3 transition-colors relative group ${
												isActive('/sello/catalogo')
													? 'text-white border-l-2 border-white'
													: 'text-white'
											}`}
											onClick={() => setMobileMenuOpen(false)}
										>
											<FileMusic size={18} className="mr-2" />
											<span>Catálogo</span>
										</Link>
										<a
											href="/admin/config"
											className={`flex items-center p-3 transition-colors relative group ${
												isActive('/admin/config')
													? 'text-white border-l-2 border-white'
													: 'text-white'
											}`}
											onClick={() => setMobileMenuOpen(false)}
										>
											<Settings size={18} className="mr-2" />
											<span>Configuraciones</span>
										</a>
									</div>
								</div>
							</nav>

							{/* Overlay for mobile menu */}
							{mobileMenuOpen && (
								<div
									className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
									onClick={toggleMobileMenu}
								/>
							)}
						</div>

						{/* Navigation Menu */}
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
