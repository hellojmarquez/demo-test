'use client';

import React, { useState, useEffect } from 'react';
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	AreaChart,
	Area,
	PieChart,
	Pie,
	Cell,
} from 'recharts';
import Pagination from '@/components/Pagination';
import FilterSelect from '@/components/FilterSelect';

interface TrendResult {
	ean: string;
	isrc: string;
	number_of_sales: number;
	territory: string;
	gender: 'male' | 'female' | 'other';
	age: string;
	store_name: string;
	trends_for_date: string;
}

interface TrendsResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: TrendResult[];
}

// Opciones para el filtro de tiendas
const storeOptions = [
	{ label: 'Amazon Music', value: 'am' },
	{ label: 'Apple Music', value: 'apm' },
	{ label: 'Beatport', value: 'bp' },
	{ label: 'Deezer', value: 'dr' },
	{ label: 'Facebook', value: 'fb' },
	{ label: 'Instagram', value: 'ig' },
	{ label: 'iTunes', value: 'it' },
	{ label: 'Pandora', value: 'pd' },
	{ label: 'Soundcloud', value: 'sc' },
	{ label: 'Spotify', value: 'sp' },
	{ label: 'Traxsource', value: 'tx' },
	{ label: 'Tiktok', value: 'tk' },
	{ label: 'Youtube', value: 'yt' },
	{ label: 'Youtube Premium', value: 'yp' },
];

// Opciones para el filtro de período
const periodOptions = [
	{ label: 'Últimos 7 días', value: '1' },
	{ label: 'Últimos 14 días', value: '2' },
	{ label: 'Últimos 30 días', value: '3' },
	{ label: 'Últimos 45 días', value: '4' },
	{ label: 'Últimos 60 días', value: '5' },
	{ label: 'Últimos 75 días', value: '6' },
	{ label: 'Últimos 90 días', value: '7' },
];

// Datos de ejemplo basados en la estructura de la API
const mockData: TrendsResponse = {
	count: 100,
	next: null,
	previous: null,
	results: [
		{
			ean: '123456789',
			isrc: 'ISRC123456',
			number_of_sales: 150,
			territory: 'USA',
			gender: 'male',
			age: '25-34',
			store_name: 'Spotify',
			trends_for_date: '2025-06-12',
		},
		{
			ean: '123456789',
			isrc: 'ISRC123456',
			number_of_sales: 120,
			territory: 'UK',
			gender: 'female',
			age: '18-24',
			store_name: 'Apple Music',
			trends_for_date: '2025-06-12',
		},
		// ... más datos de ejemplo
	],
};

// Función para procesar datos para los gráficos
const processData = (data: TrendResult[]) => {
	// Agrupar por fecha para el gráfico de ventas
	const salesByDate = data.reduce((acc, curr) => {
		const date = curr.trends_for_date;
		if (!acc[date]) {
			acc[date] = { date, total: 0 };
		}
		acc[date].total += curr.number_of_sales;
		return acc;
	}, {} as Record<string, { date: string; total: number }>);

	// Agrupar por género
	const genderData = data.reduce((acc, curr) => {
		if (!acc[curr.gender]) {
			acc[curr.gender] = 0;
		}
		acc[curr.gender] += curr.number_of_sales;
		return acc;
	}, {} as Record<string, number>);

	// Agrupar por tienda
	const storeData = data.reduce((acc, curr) => {
		if (!acc[curr.store_name]) {
			acc[curr.store_name] = 0;
		}
		acc[curr.store_name] += curr.number_of_sales;
		return acc;
	}, {} as Record<string, number>);

	return {
		salesByDate: Object.values(salesByDate),
		genderData: Object.entries(genderData).map(([name, value]) => ({
			name,
			value,
		})),
		storeData: Object.entries(storeData).map(([name, value]) => ({
			name,
			value,
		})),
	};
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const TrendsPage = () => {
	const [data, setData] = useState<TrendsResponse>(mockData);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);
	const [selectedStore, setSelectedStore] = useState('');
	const [selectedRelease, setSelectedRelease] = useState('');
	const [selectedPeriod, setSelectedPeriod] = useState('');
	const processedData = processData(data.results);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [releases, setReleases] = useState([]);
	useEffect(() => {
		const fetchData = async () => {
			try {
				const params = new URLSearchParams({
					page: currentPage.toString(),
					page_size: itemsPerPage.toString(),
					...(selectedRelease && { release: selectedRelease }),
					...(selectedStore && { store: selectedStore }),
					...(selectedPeriod && { period: selectedPeriod }),
				});

				const response = await fetch(`/trends/?${params.toString()}`);
				const newData = await response.json();
				setData(newData);
			} catch (error) {
				console.error('Error fetching trends:', error);
			}
		};

		fetchData();
	}, [
		currentPage,
		selectedRelease,
		itemsPerPage,
		selectedStore,
		selectedPeriod,
	]);
	useEffect(() => {
		const fetchReleases = async () => {
			const response = await fetch('/api/admin/getAllReleases?all=true');
			const data = await response.json();
			console.log(data.data.releases);
			if (!data.success) {
				setError(data.error);
				return;
			}
			setReleases(
				data.data.releases.map((release: any) => ({
					label: release.name,
					value: String(release.external_id),
				}))
			);
		};
		fetchReleases();
	}, []);
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleStoreChange = (value: string) => {
		setSelectedStore(value);
		setCurrentPage(1); // Resetear a la primera página al cambiar el filtro
	};
	const handleReleaseChange = (value: string) => {
		setSelectedRelease(value);
		setCurrentPage(1); // Resetear a la primera página al cambiar el filtro
	};
	const handlePeriodChange = (value: string) => {
		setSelectedPeriod(value);
		setCurrentPage(1); // Resetear a la primera página al cambiar el filtro
	};

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Reportes de Ventas</h1>

			{/* Filtros */}
			<div className="grid grid-cols-5 gap-4 mb-6">
				<FilterSelect
					value={selectedStore}
					onChange={handleStoreChange}
					options={storeOptions}
					placeholder="Seleccionar Tienda"
					className="w-full"
				/>
				<FilterSelect
					value={selectedRelease}
					onChange={handleReleaseChange}
					options={releases}
					placeholder="Seleccionar Release"
					className="w-full"
				/>

				<FilterSelect
					value={selectedPeriod}
					onChange={handlePeriodChange}
					options={periodOptions}
					placeholder="Seleccionar Período"
					className="w-full"
				/>
			</div>

			{/* Gráficos principales */}
			<div className="grid grid-cols-2 gap-6 mb-6">
				<div className="border p-4 rounded">
					<h2 className="text-lg font-semibold mb-4">Ventas por Fecha</h2>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={processedData.salesByDate}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Area
									type="monotone"
									dataKey="total"
									stroke="#8884d8"
									fill="#8884d8"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
				<div className="border p-4 rounded">
					<h2 className="text-lg font-semibold mb-4">Ventas por Tienda</h2>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={processedData.storeData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar dataKey="value" fill="#8884d8" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>

			{/* Demografía */}
			<div className="grid grid-cols-2 gap-6 mb-6">
				<div className="border p-4 rounded">
					<h2 className="text-lg font-semibold mb-4">
						Distribución por Género
					</h2>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={processedData.genderData}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, percent }) =>
										`${name} ${(percent * 100).toFixed(0)}%`
									}
									outerRadius={80}
									fill="#8884d8"
									dataKey="value"
								>
									{processedData.genderData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</div>
				</div>
				<div className="border p-4 rounded">
					<h2 className="text-lg font-semibold mb-4">Resumen de Datos</h2>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="p-4 bg-gray-50 rounded">
								<h3 className="text-sm font-medium text-gray-500">
									Total de Ventas
								</h3>
								<p className="text-2xl font-bold">{data.count}</p>
							</div>
							<div className="p-4 bg-gray-50 rounded">
								<h3 className="text-sm font-medium text-gray-500">
									Tiendas Activas
								</h3>
								<p className="text-2xl font-bold">
									{processedData.storeData.length}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Paginación */}
			<div className="mt-6">
				<Pagination
					currentPage={currentPage}
					totalPages={Math.ceil(data.count / itemsPerPage)}
					totalItems={data.count}
					itemsPerPage={itemsPerPage}
					onPageChange={handlePageChange}
				/>
			</div>
		</div>
	);
};

export default TrendsPage;
