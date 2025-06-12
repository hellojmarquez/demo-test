import React from 'react';

// Datos de ejemplo
const exampleData = {
	multi_sales_graph_data: {
		labels: [
			'2025-06-05',
			'2025-06-06',
			'2025-06-07',
			'2025-06-08',
			'2025-06-09',
			'2025-06-10',
			'2025-06-11',
		],
		combined_sales: {
			data: [100, 120, 90, 150, 130, 160, 140],
		},
		store_sales: {
			spotify: {
				data: [50, 60, 45, 75, 65, 80, 70],
			},
			apple_music: {
				data: [30, 35, 25, 40, 35, 45, 40],
			},
		},
	},
	gender_graph_data: {
		labels: ['Male', 'Female', 'Non-binary', 'Unknown'],
		data: [45, 40, 10, 5],
	},
	age_graph_data: {
		labels: [
			'13-17',
			'18-24',
			'25-34',
			'35-44',
			'45-54',
			'55-64',
			'65+',
			'Unknown',
		],
		data: {
			male: [5, 15, 20, 10, 5, 3, 2, 0],
			female: [4, 12, 18, 8, 4, 2, 1, 1],
		},
	},
	top_10_tracks: [
		{ id: 1, name: 'Track 1', streams: 1000 },
		{ id: 2, name: 'Track 2', streams: 800 },
		{ id: 3, name: 'Track 3', streams: 600 },
	],
	country_wise_sales: {
		sales: [
			{ country: 'USA', sales: 500 },
			{ country: 'UK', sales: 300 },
			{ country: 'Germany', sales: 200 },
		],
		max: 500,
	},
};

const TrendsPage = () => {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Reportes de Ventas</h1>

			{/* Filtros */}
			<div className="grid grid-cols-5 gap-4 mb-6">
				<select className="border p-2 rounded">
					<option>Seleccionar Tienda</option>
					<option>Spotify</option>
					<option>Apple Music</option>
				</select>
				<select className="border p-2 rounded">
					<option>Seleccionar Sello</option>
				</select>
				<select className="border p-2 rounded">
					<option>Seleccionar Release</option>
				</select>
				<select className="border p-2 rounded">
					<option>Seleccionar Track</option>
				</select>
				<select className="border p-2 rounded">
					<option>Seleccionar Período</option>
					<option>Últimos 7 días</option>
					<option>Últimos 30 días</option>
				</select>
			</div>

			{/* Gráficos principales */}
			<div className="grid grid-cols-2 gap-6 mb-6">
				<div className="border p-4 rounded">
					<h2 className="text-lg font-semibold mb-4">Ventas Combinadas</h2>
					<div className="h-64 bg-gray-100 flex items-end justify-around">
						{exampleData.multi_sales_graph_data.combined_sales.data.map(
							(value, index) => (
								<div
									key={index}
									className="w-8 bg-blue-500"
									style={{ height: `${(value / 160) * 100}%` }}
								/>
							)
						)}
					</div>
				</div>
				<div className="border p-4 rounded">
					<h2 className="text-lg font-semibold mb-4">Ventas por Tienda</h2>
					<div className="h-64 bg-gray-100 flex items-end justify-around">
						{exampleData.multi_sales_graph_data.store_sales.spotify.data.map(
							(value, index) => (
								<div
									key={index}
									className="w-8 bg-green-500"
									style={{ height: `${(value / 80) * 100}%` }}
								/>
							)
						)}
					</div>
				</div>
			</div>

			{/* Demografía */}
			<div className="grid grid-cols-2 gap-6 mb-6">
				<div className="border p-4 rounded">
					<h2 className="text-lg font-semibold mb-4">
						Distribución por Género
					</h2>
					<div className="h-64 bg-gray-100 flex items-end justify-around">
						{exampleData.gender_graph_data.data.map((value, index) => (
							<div
								key={index}
								className="w-16 bg-purple-500"
								style={{ height: `${value}%` }}
							/>
						))}
					</div>
				</div>
				<div className="border p-4 rounded">
					<h2 className="text-lg font-semibold mb-4">Distribución por Edad</h2>
					<div className="h-64 bg-gray-100 flex items-end justify-around">
						{exampleData.age_graph_data.data.male.map((value, index) => (
							<div
								key={index}
								className="w-8 bg-red-500"
								style={{ height: `${(value / 20) * 100}%` }}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Rankings */}
			<div className="grid grid-cols-2 gap-6">
				<div className="border p-4 rounded">
					<h2 className="text-lg font-semibold mb-4">Top 10 Tracks</h2>
					<div className="space-y-2">
						{exampleData.top_10_tracks.map(track => (
							<div key={track.id} className="flex justify-between items-center">
								<span>{track.name}</span>
								<span>{track.streams} streams</span>
							</div>
						))}
					</div>
				</div>
				<div className="border p-4 rounded">
					<h2 className="text-lg font-semibold mb-4">Ventas por País</h2>
					<div className="space-y-2">
						{exampleData.country_wise_sales.sales.map(sale => (
							<div
								key={sale.country}
								className="flex justify-between items-center"
							>
								<span>{sale.country}</span>
								<span>{sale.sales} ventas</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TrendsPage;
