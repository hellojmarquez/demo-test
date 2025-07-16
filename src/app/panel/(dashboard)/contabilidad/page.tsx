'use client';
import React, { useState, useEffect } from 'react';
import {
	Search,
	Filter,
	Download,
	Eye,
	Calendar,
	DollarSign,
	FileText,
} from 'lucide-react';

// Tipos para los datos
interface Statement {
	id: number;
	name: string;
	kind: number;
	sts_kind: number;
	quartal: number;
	month: number;
	year: number;
	year_period: string;
	issue_month: number;
	issue_year: number;
	short_description: string;
	price: string;
	currency: number;
	status: number;
	new_details: string;
	new_overview: string;
	invoice_generated: boolean;
}

interface StatementsResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: Statement[];
}

// Opciones para los filtros
const kindOptions = [
	{ value: '0', label: 'Tipo 0' },
	{ value: '1', label: 'Tipo 1' },
	{ value: '2', label: 'Tipo 2' },
];

const quartalOptions = [
	{ value: '0', label: 'Q1' },
	{ value: '1', label: 'Q2' },
	{ value: '2', label: 'Q3' },
	{ value: '3', label: 'Q4' },
];

const statusOptions = [
	{ value: '0', label: 'Pendiente' },
	{ value: '1', label: 'Completado' },
];

const invoiceOptions = [
	{ value: 'true', label: 'Factura Generada' },
	{ value: 'false', label: 'Sin Factura' },
];

const yearOptions = Array.from({ length: 10 }, (_, i) => {
	const year = new Date().getFullYear() - i;
	return { value: year.toString(), label: year.toString() };
});

const monthOptions = [
	{ value: '1', label: 'Enero' },
	{ value: '2', label: 'Febrero' },
	{ value: '3', label: 'Marzo' },
	{ value: '4', label: 'Abril' },
	{ value: '5', label: 'Mayo' },
	{ value: '6', label: 'Junio' },
	{ value: '7', label: 'Julio' },
	{ value: '8', label: 'Agosto' },
	{ value: '9', label: 'Septiembre' },
	{ value: '10', label: 'Octubre' },
	{ value: '11', label: 'Noviembre' },
	{ value: '12', label: 'Diciembre' },
];

const ContabilidadPage = () => {
	const [data, setData] = useState<StatementsResponse>({
		count: 0,
		next: null,
		previous: null,
		results: [],
	});
	const [isLoading, setIsLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);

	// Filtros
	const [search, setSearch] = useState('');
	const [stsKind, setStsKind] = useState('');
	const [year, setYear] = useState('');
	const [issueYear, setIssueYear] = useState('');
	const [quartal, setQuartal] = useState('');
	const [status, setStatus] = useState('');
	const [invoiceGenerated, setInvoiceGenerated] = useState('');
	const [ordering, setOrdering] = useState('');

	// Fetch data
	const fetchStatements = async () => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				page_size: itemsPerPage.toString(),
				...(search && { search }),
				...(stsKind && { sts_kind: stsKind }),
				...(year && { year }),
				...(issueYear && { issue_year: issueYear }),
				...(quartal && { quartal }),
				...(status && { status }),
				...(invoiceGenerated && { invoice_generated: invoiceGenerated }),
				...(ordering && { ordering }),
			});

			const response = await fetch(
				`/api/admin/statements/?${params.toString()}`
			);
			const result = await response.json();

			if (result.success) {
				setData(result.data);
			} else {
				console.error('Error fetching statements:', result.error);
			}
		} catch (error) {
			console.error('Error fetching statements:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchStatements();
	}, [
		currentPage,
		search,
		stsKind,
		year,
		issueYear,
		quartal,
		status,
		invoiceGenerated,
		ordering,
	]);

	// Helpers
	const getStatusBadge = (status: number) => {
		return status === 1 ? (
			<span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
				Completado
			</span>
		) : (
			<span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
				Pendiente
			</span>
		);
	};

	const getInvoiceBadge = (generated: boolean) => {
		return generated ? (
			<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
				Generada
			</span>
		) : (
			<span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
				Pendiente
			</span>
		);
	};

	const formatPrice = (price: string) => {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD',
		}).format(parseFloat(price) || 0);
	};

	const formatDate = (month: number, year: number) => {
		const date = new Date(year, month - 1);
		return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
	};

	return (
		<div className="p-6 max-w-7xl mx-auto">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Estados de Cuenta
				</h1>
				<p className="text-gray-600">
					Gestiona y visualiza los estados de cuenta mensuales
				</p>
			</div>

			{/* Filtros */}
			<div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-gray-900 flex items-center">
						<Filter className="w-5 h-5 mr-2" />
						Filtros
					</h2>
					<button
						onClick={() => {
							setSearch('');
							setStsKind('');
							setYear('');
							setIssueYear('');
							setQuartal('');
							setStatus('');
							setInvoiceGenerated('');
							setOrdering('');
							setCurrentPage(1);
						}}
						className="text-sm text-gray-500 hover:text-gray-700"
					>
						Limpiar filtros
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* Búsqueda */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Búsqueda
						</label>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								value={search}
								onChange={e => setSearch(e.target.value)}
								placeholder="Buscar por nombre..."
								className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
					</div>

					{/* Tipo de Statement */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Tipo
						</label>
						<select
							value={stsKind}
							onChange={e => setStsKind(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">Todos los tipos</option>
							{kindOptions.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					{/* Año */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Año
						</label>
						<select
							value={year}
							onChange={e => setYear(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">Todos los años</option>
							{yearOptions.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					{/* Trimestre */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Trimestre
						</label>
						<select
							value={quartal}
							onChange={e => setQuartal(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">Todos los trimestres</option>
							{quartalOptions.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					{/* Estado */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Estado
						</label>
						<select
							value={status}
							onChange={e => setStatus(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">Todos los estados</option>
							{statusOptions.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					{/* Factura Generada */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Factura
						</label>
						<select
							value={invoiceGenerated}
							onChange={e => setInvoiceGenerated(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">Todas las facturas</option>
							{invoiceOptions.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* Estadísticas */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
				<div className="bg-white rounded-lg shadow-sm border p-6">
					<div className="flex items-center">
						<div className="p-2 bg-blue-100 rounded-lg">
							<FileText className="w-6 h-6 text-blue-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">
								Total Statements
							</p>
							<p className="text-2xl font-bold text-gray-900">{data.count}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border p-6">
					<div className="flex items-center">
						<div className="p-2 bg-green-100 rounded-lg">
							<Calendar className="w-6 h-6 text-green-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Este Año</p>
							<p className="text-2xl font-bold text-gray-900">
								{
									data.results.filter(s => s.year === new Date().getFullYear())
										.length
								}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border p-6">
					<div className="flex items-center">
						<div className="p-2 bg-yellow-100 rounded-lg">
							<DollarSign className="w-6 h-6 text-yellow-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Total Valor</p>
							<p className="text-2xl font-bold text-gray-900">
								{formatPrice(
									data.results
										.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)
										.toString()
								)}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border p-6">
					<div className="flex items-center">
						<div className="p-2 bg-purple-100 rounded-lg">
							<Download className="w-6 h-6 text-purple-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">
								Facturas Generadas
							</p>
							<p className="text-2xl font-bold text-gray-900">
								{data.results.filter(s => s.invoice_generated).length}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Tabla */}
			<div className="bg-white rounded-lg shadow-sm border overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">
						Estados de Cuenta
					</h2>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<span className="ml-2 text-gray-600">Cargando...</span>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Nombre
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Período
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Precio
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Estado
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Factura
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Acciones
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{data.results.map(statement => (
									<tr key={statement.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{statement.name}
												</div>
												<div className="text-sm text-gray-500">
													{statement.short_description}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">
												{formatDate(statement.month, statement.year)}
											</div>
											<div className="text-sm text-gray-500">
												Q{statement.quartal} - {statement.year_period}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{formatPrice(statement.price)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{getStatusBadge(statement.status)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{getInvoiceBadge(statement.invoice_generated)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex space-x-2">
												<button className="text-blue-600 hover:text-blue-900">
													<Eye className="w-4 h-4" />
												</button>
												<button className="text-green-600 hover:text-green-900">
													<Download className="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Paginación */}
				{data.count > 0 && (
					<div className="px-6 py-4 border-t border-gray-200">
						<div className="flex items-center justify-between">
							<div className="text-sm text-gray-700">
								Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
								{Math.min(currentPage * itemsPerPage, data.count)} de{' '}
								{data.count} resultados
							</div>
							<div className="flex space-x-2">
								<button
									onClick={() => setCurrentPage(currentPage - 1)}
									disabled={!data.previous}
									className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
								>
									Anterior
								</button>
								<button
									onClick={() => setCurrentPage(currentPage + 1)}
									disabled={!data.next}
									className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
								>
									Siguiente
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ContabilidadPage;
