'use client';
import React, { useEffect, useState } from 'react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from 'recharts';
import FilterSelect from '@/components/FilterSelect';
import Select from 'react-select';
import toast from 'react-hot-toast';
// @ts-ignore

import Papa from 'papaparse';

const Page = () => {
	const [selectedLabel, setSelectedLabel] = React.useState<string>('');
	const [selectedStores, setSelectedStores] = React.useState<any[]>([]);
	const [selectedCountries, setSelectedCountries] = React.useState<any[]>([]);
	const [csvRows, setCsvRows] = useState<any[]>([]);
	const [uploadProgress, setUploadProgress] = useState<{
		total: number;
		loaded: number;
		percentage: number;
		totalChunks: number;
		filesCompleted: number;
	} | null>(null);
	const [docs, setDocs] = useState<any[]>([]);
	const [selectedDoc, setSelectedDoc] = useState<any>(null);

	// Opciones de filtro y columnas (deben ir después de los useState)
	const labelOptions = Array.from(
		new Set(csvRows.map((row: any) => String(row.Label || '')))
	)
		.filter(Boolean)
		.map((label: string) => ({ label, value: label }));
	const storeOptions = Array.from(
		new Set(csvRows.map((row: any) => String(row.Store || '')))
	)
		.filter(Boolean)
		.map((store: string) => ({ label: store, value: store }));
	const countryOptions = Array.from(
		new Set(csvRows.map((row: any) => String(row.Country || '')))
	)
		.filter(Boolean)
		.map((country: string) => ({ label: country, value: country }));
	const columns = csvRows.length > 0 ? Object.keys(csvRows[0]) : [];

	const selectedStoreValues = selectedStores.map(opt => opt.value);
	const selectedCountryValues = selectedCountries.map(opt => opt.value);
	const [file, setFile] = useState<File | null>(null);
	const filteredData = csvRows.filter(
		(row: any) =>
			(selectedLabel ? row.Label === selectedLabel : true) &&
			(selectedStores.length > 0
				? selectedStores.map((s: any) => s.value).includes(row.Store)
				: true) &&
			(selectedCountries.length > 0
				? selectedCountries.map((c: any) => c.value).includes(row.Country)
				: true)
	);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault();
		const file = e.target.files?.[0];
		if (file) {
			setFile(file);
		}
	};
	const createChunks = (file: File, chunkSize: number = 250 * 1024) => {
		const chunks = [];
		const totalChunks = Math.ceil(file.size / chunkSize);

		for (let i = 0; i < totalChunks; i++) {
			const start = i * chunkSize;
			const end = Math.min(start + chunkSize, file.size);
			chunks.push({
				chunk: file.slice(start, end),
				index: i,
				total: totalChunks,
			});
		}

		return chunks;
	};
	useEffect(() => {
		const fetchDocs = async () => {
			const response = await fetch('/api/admin/getAllDocs');
			const data = await response.json();
			if (!data.success) {
				toast.error(data.error);
			} else {
		
				setDocs(data.docs);
			}
		};
		fetchDocs();
	}, []);
	useEffect(() => {
		const fetchAndParseDoc = async () => {
			if (!selectedDoc) {
				setCsvRows([]);
				return;
			}
			const res = await fetch(`/api/admin/getAllDocs?id=${selectedDoc._id}`);
			const data = await res.json();
			if (data.success && data.doc && data.doc.fileContent) {
				const csvText = atob(data.doc.fileContent);
				const parsed = Papa.parse(csvText, { header: true });
				setCsvRows(parsed.data);
			} else {
				setCsvRows([]);
			}
		};
		fetchAndParseDoc();
	}, [selectedDoc]);
	// Función para subir un chunk
	const uploadChunk = async (
		chunk: Blob,
		chunkIndex: number,
		totalChunks: number,
		trackData: any,
		fileName: string
	) => {
		const formData = new FormData();
		formData.append('chunk', chunk);
		formData.append('chunkIndex', chunkIndex.toString());
		formData.append('totalChunks', totalChunks.toString());

		formData.append('data', JSON.stringify(trackData));
		formData.append('fileName', fileName);

		const response = await fetch('/api/admin/uploadDocs', {
			method: 'POST',
			body: formData,
		});
		if (response.ok) {
			setUploadProgress(prev => {
				if (!prev) return prev;
				const newLoaded = prev.loaded + 1;
				return {
					...prev,
					loaded: newLoaded,
					percentage: Math.floor((newLoaded / prev.totalChunks) * 100),
				};
			});
		}

		return response.json();
	};

	// Función para subir archivo completo por chunks
	const uploadFileByChunks = async (file: File, trackData: any) => {
		const chunks = createChunks(file);
		let lastResponse = null;

		for (let i = 0; i < chunks.length; i++) {
			const { chunk, index, total } = chunks[i];
			lastResponse = await uploadChunk(
				chunk,
				index,
				total,
				trackData,
				file.name
			);
		}

		return lastResponse;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!file) {
			alert('Por favor selecciona un archivo');
			return;
		}

		try {
			// Obtener fecha actual en formato dd-mm-yy
			const today = new Date();
			const day = String(today.getDate()).padStart(2, '0');
			const month = String(today.getMonth() + 1).padStart(2, '0');
			const year = String(today.getFullYear()).slice(-2);
			const formattedDate = `${day}-${month}-${year}`;

			const data = {
				description: `Archivo subido desde contabilidad interna ${formattedDate}`,
			};
			const res = await uploadFileByChunks(file, data);
			if (!res.success) {
				throw new Error(res.error);
			} else {
				toast.success('Archivo subido correctamente');
				setFile(null);
				// Limpiar el input
				const fileInput = document.getElementById('file') as HTMLInputElement;
				if (fileInput) fileInput.value = '';
			}
		} catch (error) {
			console.error('Error al procesar el archivo:', error);
			toast.error(error as string);
		}
	};

	// Datos para gráficos basados en los datos reales del CSV
	const chartData = filteredData.reduce((acc: any[], row: any) => {
		const store = row.Store || 'Sin tienda';
		const existingStore = acc.find(item => item.Store === store);

		const totalEUR = parseFloat(row.TotalEUR || row['Total EUR'] || '0') || 0;
		const totalDue =
			parseFloat(row.TotalDue || row['Total Due To Pay EUR'] || '0') || 0;

		if (existingStore) {
			existingStore.TotalEUR += totalEUR;
			existingStore.TotalDue += totalDue;
		} else {
			acc.push({
				Store: store,
				TotalEUR: totalEUR,
				TotalDue: totalDue,
			});
		}
		return acc;
	}, []);

	const typeChartData = filteredData.reduce((acc: any[], row: any) => {
		const type = row.Type || row['Type of Use'] || 'Sin tipo';
		const existingType = acc.find(item => item.Type === type);

		const totalEUR = parseFloat(row.TotalEUR || row['Total EUR'] || '0') || 0;
		const totalDue =
			parseFloat(row.TotalDue || row['Total Due To Pay EUR'] || '0') || 0;

		if (existingType) {
			existingType.TotalEUR += totalEUR;
			existingType.TotalDue += totalDue;
		} else {
			acc.push({
				Type: type,
				TotalEUR: totalEUR,
				TotalDue: totalDue,
			});
		}
		return acc;
	}, []);

	const typePieData = typeChartData.map(item => ({
		name: item.Type,
		value: item.TotalEUR,
	}));

	const COLORS = [
		'#8884d8',
		'#82ca9d',
		'#ffc658',
		'#ff8042',
		'#8dd1e1',
		'#a4de6c',
		'#d0ed57',
		'#ffbb28',
	];

	// 1. Mapear docs a opciones para el select
	const docOptions = docs.map(doc => ({
		label: doc.fileName,
		value: doc,
	}));

	return (
		<div style={{ padding: 24 }}>
			<h1 className="text-2xl font-bold">Reporte Interno</h1>
			<div className=" flex items-center justify-between">
				<div style={{ minWidth: 250 }}>
					<p>Seleccione reporte a vizsualizar</p>
					<Select
						options={docOptions}
						value={
							selectedDoc
								? docOptions.find(opt => opt.value._id === selectedDoc._id)
								: null
						}
						onChange={option => setSelectedDoc(option ? option.value : null)}
						placeholder="Selecciona un archivo CSV..."
						isClearable
					/>
				</div>
				<form className="bg-white rounded-lg shadow-sm border p-3 max-w-sm">
					<div className="space-y-3">
						<div>
							<label
								htmlFor="file"
								className="block text-xs font-medium text-gray-700 mb-1"
							>
								Archivo
							</label>
							<div className="relative">
								<input
									type="file"
									id="file"
									accept=".csv,.xlsx,.pdf,.txt"
									onChange={handleFileChange}
									className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
								/>
							</div>
							<p className="mt-1 text-xs text-gray-400">
								CSV, XLSX, PDF, TXT (máx. 50MB)
							</p>
						</div>

						<button
							type="button"
							onClick={handleSubmit}
							className="w-full bg-blue-600 text-white py-1.5 px-3 rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 font-medium"
						>
							Subir
						</button>
					</div>
				</form>
			</div>
			<div
				style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}
			>
				<div style={{ minWidth: 250 }}>
					<FilterSelect
						value={selectedLabel}
						onChange={setSelectedLabel}
						options={[
							{ label: 'Todos los Labels', value: '' },
							...labelOptions,
						]}
						placeholder="Filtrar por Label"
					/>
				</div>
				<div style={{ minWidth: 250 }}>
					<Select
						isMulti
						value={selectedStores}
						onChange={opts =>
							setSelectedStores(opts as { label: string; value: string }[])
						}
						options={storeOptions}
						placeholder="Filtrar por Tienda"
						classNamePrefix="react-select"
					/>
				</div>
				<div style={{ minWidth: 250 }}>
					<Select
						isMulti
						value={selectedCountries}
						onChange={opts =>
							setSelectedCountries(opts as { label: string; value: string }[])
						}
						options={countryOptions}
						placeholder="Filtrar por País"
						classNamePrefix="react-select"
					/>
				</div>
			</div>
			<h2>Ingresos por Tienda</h2>
			<div
				style={{ width: '100%', maxWidth: 800, height: 350, marginBottom: 40 }}
			>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={chartData}
						margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
					>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="Store" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Bar dataKey="TotalEUR" fill="#8884d8" name="Total EUR" />
						<Bar
							dataKey="TotalDue"
							fill="#82ca9d"
							name="Total Due To Pay EUR"
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
			<h2>Ingresos por Tipo de Uso</h2>
			<div
				style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}
			>
				<div style={{ flex: 1, minWidth: 350, height: 350 }}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={typeChartData}
							margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
						>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="Type" />
							<YAxis />
							<Tooltip />
							<Legend />
							<Bar dataKey="TotalEUR" fill="#8884d8" name="Total EUR" />
							<Bar
								dataKey="TotalDue"
								fill="#82ca9d"
								name="Total Due To Pay EUR"
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
				<div style={{ flex: 1, minWidth: 350, height: 350 }}>
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={typePieData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								outerRadius={100}
								label
							>
								{typePieData.map((entry, index) => (
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
			{filteredData.length > 0 && (
				<div className="overflow-x-auto mt-6">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								{columns.map(col => (
									<th
										key={col}
										className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{col}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredData.map((row, idx) => (
								<tr key={idx}>
									{columns.map(col => (
										<td
											key={col}
											className="px-4 py-2 whitespace-nowrap text-sm text-gray-700"
										>
											{row[col]}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};

export default Page;
