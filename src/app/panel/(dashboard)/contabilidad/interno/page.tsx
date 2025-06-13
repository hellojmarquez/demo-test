'use client';
import React from 'react';
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

interface ExampleRow {
	Month: string;
	Year: string;
	Store: string;
	Label: string;
	Organization: string;
	Artist: string;
	Title: string;
	Release: string;
	Mix: string;
	UPC: string;
	ISRC: string;
	Country: string;
	Type: string;
	Items: string;
	Currency: string;
	TotalEUR: string;
	TotalDue: string;
}

const exampleData: ExampleRow[] = [
	{
		Month: 'February',
		Year: '2025',
		Store: 'Deezer',
		Label: 'Test Label 1',
		Organization: 'your-org-name',
		Artist: 'Ella Thompson',
		Title: 'Song Name 1',
		Release: 'Release Name 1',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334112',
		Country: 'FR',
		Type: 'Download',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.004845',
		TotalDue: '0.00412',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'Deezer',
		Label: 'Test Label 1',
		Organization: 'your-org-name',
		Artist: 'Ella Thompson',
		Title: 'Song Name 1',
		Release: 'Release Name 1',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334112',
		Country: 'FR',
		Type: 'Streaming',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.004845',
		TotalDue: '0.00412',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'Deezer',
		Label: 'Test Label 1',
		Organization: 'your-org-name',
		Artist: 'Ella Thompson',
		Title: 'Song Name 1',
		Release: 'Release Name 1',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334112',
		Country: 'FR',
		Type: 'UGC',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.004845',
		TotalDue: '0.00412',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'Audiomack',
		Label: 'Test Label 2',
		Organization: 'your-org-name',
		Artist: 'Ella Thompson',
		Title: 'Song Name 2',
		Release: 'Release Name 2',
		Mix: 'Random Mix Name',
		UPC: '123456789147548',
		ISRC: 'QZYN92334113',
		Country: 'FR',
		Type: 'Streaming',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.005437',
		TotalDue: '0.00462',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'Qobuz',
		Label: 'Test Label 3',
		Organization: 'your-org-name',
		Artist: 'Javier El Timbalero Gonzalez',
		Title: 'Song Name 3',
		Release: 'Release Name 3',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334114',
		Country: 'GB',
		Type: 'UGC',
		Items: '2',
		Currency: 'EUR',
		TotalEUR: '0.006469',
		TotalDue: '0.0055',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'Deezer',
		Label: 'Test Label 4',
		Organization: 'your-org-name',
		Artist: 'Straterial',
		Title: 'Song Name 4',
		Release: 'Release Name 4',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334115',
		Country: 'FR',
		Type: 'PGC',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.00138',
		TotalDue: '0.00117',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'LINE Music',
		Label: 'Test Label 5',
		Organization: 'your-org-name',
		Artist: 'Osterh',
		Title: 'Song Name 5',
		Release: 'Release Name 5',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334116',
		Country: 'FR',
		Type: 'Radio',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.002239',
		TotalDue: '0.0019',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'MelOn',
		Label: 'Test Label 6',
		Organization: 'your-org-name',
		Artist: 'Los Tumbaos del Caribe',
		Title: 'Song Name 6',
		Release: 'Release Name 6',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334117',
		Country: 'MX',
		Type: 'Streaming',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.00245',
		TotalDue: '0.00208',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'Tidal',
		Label: 'Test Label 7',
		Organization: 'your-org-name',
		Artist: 'Ella Thompson',
		Title: 'Song Name 7',
		Release: 'Release Name 7',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334118',
		Country: 'FR',
		Type: 'Streaming',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.004845',
		TotalDue: '0.00412',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'Tidal',
		Label: 'Test Label 8',
		Organization: 'your-org-name',
		Artist: 'El Decidido',
		Title: 'Song Name 8',
		Release: 'Release Name 8',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334119',
		Country: 'FR',
		Type: 'Streaming',
		Items: '2',
		Currency: 'EUR',
		TotalEUR: '0',
		TotalDue: '0',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'Spotify',
		Label: 'Test Label 9',
		Organization: 'your-org-name',
		Artist: 'Ella Thompson',
		Title: 'Song Name 9',
		Release: 'Release Name 9',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334120',
		Country: 'FR',
		Type: 'Streaming',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.005437',
		TotalDue: '0.00462',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'Apple Music',
		Label: 'Test Label 10',
		Organization: 'your-org-name',
		Artist: 'Noa Jacquet',
		Title: 'Song Name 10',
		Release: 'Release Name 10',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334121',
		Country: 'FR',
		Type: 'Streaming',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.000258',
		TotalDue: '0.00022',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'YouTube',
		Label: 'Test Label 11',
		Organization: 'your-org-name',
		Artist: 'Manona',
		Title: 'Song Name 11',
		Release: 'Release Name 11',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334122',
		Country: 'HT',
		Type: 'Streaming',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.00009',
		TotalDue: '0.00007',
	},
	{
		Month: 'February',
		Year: '2025',
		Store: 'Meta',
		Label: 'Test Label 12',
		Organization: 'your-org-name',
		Artist: 'Manona',
		Title: 'Song Name 12',
		Release: 'Release Name 12',
		Mix: '',
		UPC: '123456789147548',
		ISRC: 'QZYN92334123',
		Country: 'CG',
		Type: 'Streaming',
		Items: '1',
		Currency: 'EUR',
		TotalEUR: '0.000156',
		TotalDue: '0.00013',
	},
];

const columns: (keyof ExampleRow)[] = [
	'Month',
	'Year',
	'Store',
	'Label',
	'Organization',
	'Artist',
	'Title',
	'Release',
	'Mix',
	'UPC',
	'ISRC',
	'Country',
	'Type',
	'Items',
	'Currency',
	'TotalEUR',
	'TotalDue',
];

const labelOptions = Array.from(new Set(exampleData.map(row => row.Label))).map(
	label => ({ label, value: label })
);

const storeOptions = Array.from(new Set(exampleData.map(row => row.Store))).map(
	store => ({ label: store, value: store })
);

const countryOptions = Array.from(
	new Set(exampleData.map(row => row.Country))
).map(country => ({ label: country, value: country }));

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

const Page = () => {
	const [selectedLabel, setSelectedLabel] = React.useState('');
	const [selectedStores, setSelectedStores] = React.useState(storeOptions);
	const [selectedCountries, setSelectedCountries] =
		React.useState(countryOptions);

	const selectedStoreValues = selectedStores.map(opt => opt.value);
	const selectedCountryValues = selectedCountries.map(opt => opt.value);

	// Filtrar por label, tiendas y países
	const filteredData = exampleData.filter(
		row =>
			(selectedLabel ? row.Label === selectedLabel : true) &&
			(selectedStoreValues.length > 0
				? selectedStoreValues.includes(row.Store)
				: true) &&
			(selectedCountryValues.length > 0
				? selectedCountryValues.includes(row.Country)
				: true)
	);

	// Agrupar ingresos por tienda con filtro
	const storeTotals = filteredData.reduce<
		Record<string, { TotalEUR: number; TotalDue: number }>
	>((acc, row) => {
		if (!acc[row.Store]) {
			acc[row.Store] = { TotalEUR: 0, TotalDue: 0 };
		}
		acc[row.Store].TotalEUR += parseFloat(row.TotalEUR) || 0;
		acc[row.Store].TotalDue += parseFloat(row.TotalDue) || 0;
		return acc;
	}, {});

	const chartData = Object.entries(storeTotals).map(([store, totals]) => ({
		Store: store,
		TotalEUR: totals.TotalEUR,
		TotalDue: totals.TotalDue,
	}));

	// Agrupar ingresos por tipo de uso con filtro
	const typeTotals = filteredData.reduce<
		Record<string, { TotalEUR: number; TotalDue: number }>
	>((acc, row) => {
		if (!acc[row.Type]) {
			acc[row.Type] = { TotalEUR: 0, TotalDue: 0 };
		}
		acc[row.Type].TotalEUR += parseFloat(row.TotalEUR) || 0;
		acc[row.Type].TotalDue += parseFloat(row.TotalDue) || 0;
		return acc;
	}, {});

	const typeChartData = Object.entries(typeTotals).map(([type, totals]) => ({
		Type: type,
		TotalEUR: totals.TotalEUR,
		TotalDue: totals.TotalDue,
	}));

	const typePieData = Object.entries(typeTotals).map(([type, totals]) => ({
		name: type,
		value: totals.TotalEUR,
	}));

	return (
		<div style={{ padding: 24 }}>
			<h1>Reporte Interno</h1>
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
		</div>
	);
};

export default Page;
