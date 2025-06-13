'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Users, Info, User, Network } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SettingsProvider } from '@/context/SettingsContext';

const inter = Inter({ subsets: ['latin'] });

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, loading } = useAuth();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const pathname = usePathname();

	const isActive = (path: string) => {
		return pathname === path;
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-light"></div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<SettingsProvider>
			<div
				className={`${inter.className} max-w-[1290px] px-6 min-h-screen bg-gray-50`}
			>
				<div className="flex flex-col min-h-screen">
					<nav className="hidden md:flex md:justify-between md:w-full">
						<div className="flex items-center space-x-4">
							<Link
								href="/panel/settings"
								className={`flex items-center p-2 transition-colors relative group ${
									isActive('/panel/settings')
										? 'text-brand-dark border-b-2 border-brand-dark'
										: 'text-gray-900'
								}`}
								onClick={() => setMobileMenuOpen(false)}
							>
								<Info size={18} className="mr-2" />
								<span>Detalles</span>
								<span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
							</Link>

							<Link
								href="/panel/settings/cuentas"
								className={`flex items-center p-2 transition-colors relative group ${
									isActive('/panel/settings/cuentas')
										? 'text-brand-dark border-b-2 border-brand-dark'
										: 'text-gray-900'
								}`}
								onClick={() => setMobileMenuOpen(false)}
							>
								<Network size={18} className="mr-2" />
								<span>Cuentas</span>
								<span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
							</Link>

							<Link
								href="/panel/settings/usuarios"
								className={`flex items-center p-2 transition-colors relative group ${
									isActive('/panel/settings/usuarios')
										? 'text-brand-dark border-b-2 border-brand-dark'
										: 'text-gray-900'
								}`}
								onClick={() => setMobileMenuOpen(false)}
							>
								<Users size={18} className="mr-2" />
								<span>Usuarios</span>
								<span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
							</Link>
						</div>
					</nav>

					<div className="md:hidden w-full">
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="p-2"
						>
							{mobileMenuOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</button>
					</div>

					<AnimatePresence>
						{mobileMenuOpen && (
							<motion.div
								initial={{ opacity: 0, y: -20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.2 }}
								className="md:hidden w-full bg-white shadow-lg rounded-lg mt-2"
							>
								<div className="py-2">
									<Link
										href="/panel/settings"
										className={`block px-4 py-2 ${
											isActive('/panel/settings')
												? 'text-brand-dark bg-brand-light'
												: 'text-gray-900'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										Detalles
									</Link>
									<Link
										href="/panel/settings/cuentas"
										className={`block px-4 py-2 ${
											isActive('/panel/settings/cuentas')
												? 'text-brand-dark bg-brand-light'
												: 'text-gray-900'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										Cuentas
									</Link>
									<Link
										href="/panel/settings/artistProfile"
										className={`block px-4 py-2 ${
											isActive('/panel/settings/artistProfile')
												? 'text-brand-dark bg-brand-light'
												: 'text-gray-900'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										Perfil Artista
									</Link>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					<main className="flex-1 p-6">{children}</main>
				</div>
			</div>
		</SettingsProvider>
	);
}
