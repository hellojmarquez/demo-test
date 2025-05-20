'use client';

import React, { useState } from 'react';
import Productos from './Productos';
import Assets from './Assets';
import Sellos from './Sellos';
import Personas from './Personas';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = ['PRODUCTOS', 'ASSETS', 'SELLOS', 'PERSONAS'];

export default function Catalogo() {
	const [selected, setSelected] = useState('PRODUCTOS');
	const pathname = usePathname();

	const renderComponent = () => {
		switch (selected) {
			case 'PRODUCTOS':
				return <Productos />;
			case 'ASSETS':
				return <Assets />;
			case 'SELLOS':
				return <Sellos />;
			case 'PERSONAS':
				return <Personas />;
			default:
				return <Productos />;
		}
	};

	return (
		<div className="min-h-screen px-4 py-6 sm:px-6 md:px-8">
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
				<div className="bg-white rounded-lg shadow-sm  ">
					{renderComponent()}
				</div>
			</div>
		</div>
	);
}
