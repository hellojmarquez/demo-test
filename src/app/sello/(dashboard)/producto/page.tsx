'use client';

import { useEffect, useState } from 'react';
import FormArtista from './FormArtista';
import FormSingle from './FormSingle';
import FormSello from './FormSello';
import FormRelease from './FormRelease';

const opciones = [
	// { value: 'artista', label: 'Artista' },
	{ value: 'release', label: 'Release' },
	// { value: 'sello', label: 'Sello' },
	{ value: 'single', label: 'Single' },
];

export default function CrearProductoMusica() {
	const [tipoProducto, setTipoProducto] = useState('artista');

	return (
		<div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-md space-y-6">
			<h2 className="text-3xl font-bold text-blue-700">
				Crear Producto Musical
			</h2>

			{/* Selector de tipo con botones */}
			<div>
				<p className="text-sm font-medium mb-2 text-gray-700">
					Tipo de producto
				</p>
				<div className="grid grid-cols-2 sm:flex gap-3">
					{opciones.map(op => (
						<button
							key={op.value}
							onClick={() => setTipoProducto(op.value)}
							className={`px-4 py-2 rounded-md text-sm font-semibold border transition 
                ${
									tipoProducto === op.value
										? 'bg-blue-600 text-white border-blue-600'
										: 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50'
								}`}
						>
							{op.label}
						</button>
					))}
				</div>
			</div>

			{/* Render de formularios */}
			<div className="animate-fade-in">
				{/* {tipoProducto === 'artista' && (
					<FormArtista tipoProducto={tipoProducto} />
				)} */}
				{tipoProducto === 'release' && (
					<FormRelease tipoProducto={tipoProducto} />
				)}
				{/* {tipoProducto === 'sello' && <FormSello />} */}
				{tipoProducto === 'single' && (
					<FormSingle tipoProducto={tipoProducto} />
				)}
			</div>
		</div>
	);
}
