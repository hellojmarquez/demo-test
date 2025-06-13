// src/app/panel/(dashboard)/layout.tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import AccountSelector from '@/components/AccountSelector';
import AccountSwitchButton from '@/components/AccountSwitchButton';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
	Menu,
	X,
	Home,
	Users,
	MessageSquare,
	FileMusic,
	Settings,
	Calculator,
	NotebookPen,
	ChevronDown,
	BarChart2,
	LineChart,
	Receipt,
	DollarSign,
	TrendingUp,
	TrendingUpDown,
} from 'lucide-react';
import Script from 'next/script';

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
	const [statsMenuOpen, setStatsMenuOpen] = useState(false);
	const [catalogMenuOpen, setCatalogMenuOpen] = useState(false);
	const pathname = usePathname();

	const isActive = (path: string) => {
		if (path === '/panel') {
			return pathname?.toString() === path;
		}
		if (path === '/panel/estadisticas') {
			return pathname?.toString().startsWith('/panel/estadisticas');
		}
		if (path === '/panel/conntabilidad') {
			return pathname?.toString().startsWith('/panel/conntabilidad');
		}
		if (path === '/panel/catalogo') {
			return pathname?.toString() === '/panel/catalogo';
		}
		if (path === '/panel/ddx-delivery') {
			return pathname?.toString() === '/panel/ddx-delivery';
		}
		if (path === '/panel/trends') {
			return pathname?.toString() === '/panel/trends';
		}
		return (
			pathname?.toString() === path ||
			pathname?.toString().startsWith(path + '/')
		);
	};

	const isAdmin = user?.role === 'admin';

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
			<Script
				id="ze-snippet"
				src="https://static.zdassets.com/ekr/snippet.js?key=fcddf08a-ccb3-42ac-8dcc-cbb79fb87082"
				strategy="afterInteractive"
			/>
			<AccountSelector />
			<div className="min-h-screen flex flex-col items-center bg-white ">
				{/* Header with Navigation */}
				<header className="bg-brand-dark w-full shadow z-50">
					<div className="max-w-[1290px] mx-auto">
						{/* Top Bar */}
						<div className="flex  justify-between md:justify-start px-6 items-center md:space-x-10 py-4">
							<div className="flex items-center">
								<Link href="/panel">
									<img
										src="/logo_white.png"
										alt="Isla Sounds"
										className="h-3"
									/>
								</Link>
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
							<nav className="hidden  md:flex md:justify-between md:w-full">
								<div className="flex items-center space-x-4">
									<div className="relative group">
										<button
											className={`flex items-center p-2 text-white ${
												isActive('/panel/catalogo') ? 'border-b-2' : ''
											}`}
										>
											<FileMusic size={18} className="mr-2" />
											<span>Catálogo</span>
											<ChevronDown size={16} className="ml-1" />
										</button>
										<div className="absolute left-0 mt-2 w-48 bg-brand-dark shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
											<div className="py-1">
												<Link
													href="/panel/catalogo"
													className="block px-4 py-2 text-white hover:bg-brand-light"
													onClick={() => setMobileMenuOpen(false)}
												>
													Catálogo
												</Link>
												{isAdmin && (
													<Link
														href="/panel/ddx-delivery"
														className="block px-4 py-2 text-white hover:bg-brand-light"
														onClick={() => setMobileMenuOpen(false)}
													>
														DDEX-Delivery
													</Link>
												)}
											</div>
										</div>
									</div>
									<Link
										href="/panel/trends"
										className={`flex items-center p-2 transition-colors relative group ${
											isActive('/panel/trends')
												? 'text-white border-b-2'
												: 'text-white'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										<TrendingUpDown size={18} className="mr-2" />
										<span>Estadísticas</span>
										<span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
									</Link>
									{isAdmin && (
										<>
											<Link
												href="/panel/contabilidad"
												className={`flex items-center p-2 transition-colors relative group ${
													isActive('/panel/contabilidad')
														? 'text-white border-b-2'
														: 'text-white'
												}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<DollarSign size={18} className="mr-2" />
												<span>Contabilidad</span>
												<span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
											</Link>
											<Link
												href="/panel/logs"
												className={`flex items-center p-2 transition-colors relative group ${
													isActive('/panel/logs')
														? 'text-white border-b-2'
														: 'text-white'
												}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<NotebookPen size={18} className="mr-2" />
												<span>Logs</span>
												<span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
											</Link>
										</>
									)}
								</div>
								<div className="flex items-center space-x-4">
									<AccountSwitchButton />
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
									<div className="w-full sm:flex sm:mx-auto sm:items-center">
										<div className="w-full mx-auto">
											<AccountSwitchButton
												onMenuClose={() => setMobileMenuOpen(false)}
											/>
										</div>
									</div>
									<div className="flex flex-col px-4 py-2">
										<button
											onClick={() => setCatalogMenuOpen(!catalogMenuOpen)}
											className="flex items-center p-3 text-white w-full"
										>
											<FileMusic size={18} className="mr-2" />
											<span>Catálogo</span>
											<ChevronDown
												size={16}
												className={`ml-2 transition-transform duration-200 ${
													catalogMenuOpen ? 'rotate-180' : ''
												}`}
											/>
										</button>
										<div
											className={`pl-8 overflow-hidden transition-all duration-200 ${
												catalogMenuOpen ? 'max-h-32' : 'max-h-0'
											}`}
										>
											<Link
												href="/panel/catalogo"
												className={`flex items-center p-3 transition-colors relative group ${
													isActive('/panel/catalogo')
														? 'text-white border-l-2 border-white'
														: 'text-white'
												}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<span>Catálogo</span>
											</Link>
											{isAdmin && (
												<Link
													href="/panel/ddx-delivery"
													className={`flex items-center p-3 transition-colors relative group ${
														isActive('/panel/ddx-delivery')
															? 'text-white border-l-2 border-white'
															: 'text-white'
													}`}
													onClick={() => setMobileMenuOpen(false)}
												>
													<span>DDEX-Delivery</span>
												</Link>
											)}
										</div>
										<Link
											href="/panel/trends"
											className={`flex items-center p-3 transition-colors relative group ${
												isActive('/panel/trends')
													? 'text-white border-l-2 border-white'
													: 'text-white'
											}`}
											onClick={() => setMobileMenuOpen(false)}
										>
											<TrendingUpDown size={18} className="mr-2" />
											<span>Estadísticas</span>
										</Link>
										{isAdmin && (
											<>
												<Link
													href="/panel/contabilidad"
													className={`flex items-center p-3 transition-colors relative group ${
														isActive('/panel/contabilidad')
															? 'text-white border-l-2 border-white'
															: 'text-white'
													}`}
													onClick={() => setMobileMenuOpen(false)}
												>
													<DollarSign size={18} className="mr-2" />
													<span>Contabilidad</span>
												</Link>
												<Link
													href="/panel/logs"
													className={`flex items-center p-3 transition-colors relative group ${
														isActive('/panel/logs')
															? 'text-white border-l-2 border-white'
															: 'text-white'
													}`}
													onClick={() => setMobileMenuOpen(false)}
												>
													<NotebookPen size={18} className="mr-2" />
													<span>Logs</span>
												</Link>
											</>
										)}
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
					className={`${inter.className} w-[1290px] max-w-full text-gray-900 min-h-screen py-8`}
				>
					<div className="mx-auto">{children}</div>
				</main>
			</div>
		</>
	);
}
