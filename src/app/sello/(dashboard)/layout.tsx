// src/app/sello/(dashboard)/layout.tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import AccountSelector from '@/components/AccountSelector';
import AccountSwitchButton from '@/components/AccountSwitchButton';
import { Inter } from 'next/font/google';
import Link from 'next/link';

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

	return (
		<>
			<AccountSelector />
			<div className="min-h-screen bg-gray-50">
				<header className="bg-white shadow">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
						<h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
						<div className="flex items-center space-x-4">
							<AccountSwitchButton />
						</div>
					</div>
				</header>
				<div
					className={`${inter.className} bg-[#f0ecf1] text-gray-900 min-h-screen flex`}
				>
					<aside className="w-64 bg-white shadow-md p-4 hidden md:block">
						<h2 className="text-[#0f4ccc] font-semibold text-lg mb-4">
							{user.name} {user.role}
						</h2>
						<nav className="space-y-2 text-sm">
							<Link href="/sello" className="block hover:text-[#0f4ccc]">
								Dashboard
							</Link>
							<Link
								href="/sello/cuentas"
								className="block hover:text-[#0f4ccc]"
							>
								Usuarios
							</Link>
							<a href="/admin/mensajes" className="block hover:text-[#0f4ccc]">
								Mensajes
							</a>
							<Link href="/sello/tracks" className="block hover:text-[#0f4ccc]">
								Tracks
							</Link>
							<a href="/admin/config" className="block hover:text-[#0f4ccc]">
								Configuraciones
							</a>

							<Link
								href="/sello/producto"
								className="block max-w-fit px-4 py-2 rounded-md bg-green-200 text-green-600 hover:text-green-900"
							>
								Crear producto
							</Link>
						</nav>
					</aside>
					<main className="flex-1 p-4 md:p-8 bg-[#f0ecf1]">
						<header className=" flex justify-between items-center mb-2">
							<h1 className="text-2xl font-bold text-[#0f4ccc]">
								Bienvenido {user?.name}{' '}
								{currentAccount &&
									` - ${currentAccount.name} (${currentAccount.type})`}
							</h1>
							<button
								onClick={() => {
									document.cookie =
										'session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
									window.location.href = 'https://login.islasounds.com';
								}}
								className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
							>
								Cerrar sesión
							</button>
						</header>
						{children}
					</main>
				</div>
			</div>
		</>
	);
}
