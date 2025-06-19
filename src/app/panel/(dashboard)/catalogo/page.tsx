'use client';

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';

// Lazy load de los componentes
const Productos = dynamic(() => import('./Productos'), {
	loading: () => <div className="p-4">Cargando Productos...</div>,
	ssr: false,
});

const Assets = dynamic(() => import('./Assets'), {
	loading: () => <div className="p-4">Cargando Assets...</div>,
	ssr: false,
});

const Sellos = dynamic(() => import('./Sellos'), {
	loading: () => <div className="p-4">Cargando Sellos...</div>,
	ssr: false,
});

const Personas = dynamic(() => import('./Personas'), {
	loading: () => <div className="p-4">Cargando Personas...</div>,
	ssr: false,
});

export default function Catalogo() {
	const [selected, setSelected] = useState('PRODUCTOS');
	const { user } = useAuth();

	// Filtrar los items del menú basado en el rol del usuario
	const menuItems = ['PRODUCTOS', 'ASSETS'];

	// Solo agregar PERSONAS y SELLOS si no es publisher ni contributor
	if (
		user?.role?.toLowerCase() !== 'publisher' &&
		user?.role?.toLowerCase() !== 'contributor'
	) {
		menuItems.push('PERSONAS');
		if (user?.role?.toLowerCase() !== 'sello') {
			menuItems.push('SELLOS');
		}
	}

	const renderComponent = () => {
		switch (selected) {
			case 'PRODUCTOS':
				return <Productos />;
			case 'ASSETS':
				return <Assets />;
			case 'SELLOS':
				// Si el usuario es un sello, publisher o contributor, redirigir a productos
				if (
					user?.role?.toLowerCase() === 'sello' ||
					user?.role?.toLowerCase() === 'publisher' ||
					user?.role?.toLowerCase() === 'contributor'
				) {
					return <Productos />;
				}
				return <Sellos />;
			case 'PERSONAS':
				// Si el usuario es publisher o contributor, redirigir a productos
				if (
					user?.role?.toLowerCase() === 'publisher' ||
					user?.role?.toLowerCase() === 'contributor'
				) {
					return <Productos />;
				}
				return <Personas />;
			default:
				return <Productos />;
		}
	};

	return (
		<div className="min-h-screen px-4 py-6 sm:px-6 md:px-6">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
						Catálogo
					</h1>
				</div>

				{/* Menú de navegación */}
				<nav className="rounded-lg overflow-hidden">
					<div className="overflow-x-auto">
						<ul className="flex space-x-8 p-4 min-w-max">
							{menuItems.map(item => (
								<li
									key={item}
									onClick={() => setSelected(item)}
									className={`relative cursor-pointer whitespace-nowrap after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:bg-brand-boldblack after:transition-all after:duration-300 after:origin-center hover:after:w-full hover:after:translate-x-[-50%]
									${selected === item ? 'after:w-full after:translate-x-[-50%]' : 'after:w-0'}
									`}
								>
									{item}
								</li>
							))}
						</ul>
					</div>
				</nav>

				{/* Contenido */}
				<div className="bg-white rounded-lg shadow-sm">
					<Suspense fallback={<div className="p-4">Cargando contenido...</div>}>
						{renderComponent()}
					</Suspense>
				</div>
			</div>
		</div>
	);
}
