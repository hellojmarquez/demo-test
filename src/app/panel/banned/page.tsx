'use client';

import { useEffect } from 'react';
import { storage } from '@/lib/storage';

export default function BannedPage() {
	useEffect(() => {
		// Limpiar cualquier sesión o token existente
		storage.clear(); // Esto limpiará user y currentAccount
		document.cookie =
			'loginToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		document.cookie =
			'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		document.cookie =
			'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
	}, []);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
				<h1 className="text-2xl font-bold text-red-600 mb-4">Cuenta Baneada</h1>
				<p className="text-gray-600 mb-4">
					Tu cuenta ha sido suspendida. Por favor, contacta con el administrador
					para más información.
				</p>
			</div>
		</div>
	);
}
