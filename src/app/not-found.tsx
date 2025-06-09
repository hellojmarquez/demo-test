'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
	const router = useRouter();

	return (
		<div className="min-h-screen bg-white flex items-center justify-center px-4">
			<div className="max-w-lg w-full text-center">
				<img src="/images/not_found.svg" alt="page not found" />
				<h1 className="text-lg md:text-3xl font-semibold text-gray-800 mt-4">
					Página no encontrada
				</h1>
				<p className="text-gray-600 mt-2 mb-8 text-sm md:text-base">
					Lo sentimos, la página que estás buscando no existe o ha sido movida.
				</p>
				<div className="space-x-4">
					<button
						onClick={() => router.back()}
						className="px-6 py-2  text-gray-700 hover:text-brand-light rounded-md transition-colors flex items-center mx-auto md:mx-0 md:inline-flex"
					>
						<ArrowLeft size={18} className="mr-2" />
						Volver atrás
					</button>
					<Link
						href="/panel"
						className="px-6 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-dark/90 transition-colors inline-block"
					>
						Ir al Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}
