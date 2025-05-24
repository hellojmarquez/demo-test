'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function BannedPage() {
	useEffect(() => {
		// Limpiar cualquier sesión o token existente
		localStorage.removeItem('token');
		sessionStorage.removeItem('token');
		document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
			<div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
				<div className="flex justify-center mb-6">
					<div className="bg-red-100 p-4 rounded-full">
						<AlertTriangle className="h-12 w-12 text-red-500" />
					</div>
				</div>

				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					Cuenta Bloqueada
				</h1>

				<div className="space-y-4 mb-8">
					<p className="text-gray-600">
						Lo sentimos, tu cuenta ha sido bloqueada por violar nuestros
						términos de servicio.
					</p>
					<p className="text-gray-600">
						Si crees que esto es un error, por favor contacta a nuestro equipo
						de soporte.
					</p>
				</div>

				<a
					href="mailto:soporte@islasounds.com"
					className="block text-sm text-gray-500 hover:text-gray-700"
				>
					¿Necesitas ayuda? Contáctanos
				</a>
			</div>
		</div>
	);
}
