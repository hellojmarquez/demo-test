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
			<div className="min-h-screen bg-gray-50">
				<header className="bg-brand-light h-24 flex items-center border-b border-gray-200">
					<div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex justify-between items-center h-16">
							<div className="flex items-center">
								<img
									src="/logo_white.png"
									alt="Isla Sounds"
									className="h-4 w-auto"
								/>
							</div>
							<div className="flex items-center space-x-4">
								<p className="text-sm text-white">
									Bienvenido, {user?.name || 'Usuario'}
								</p>
								<AccountSwitchButton />
							</div>
						</div>
					</div>
				</header>
				<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{children}
				</main>
			</div>
		</>
	);
}
