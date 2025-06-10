'use client';
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Pagination from '@/components/Pagination';
import SearchInput from '@/components/SearchInput';

interface StoreConfirmation {
	store: string;
	status: boolean;
}

interface DDXDeliveryItem {
	id: number;
	release_name: string;
	upc: string;
	action: 'INSERT' | 'TAKEDOWN' | 'FULL_UPDATE' | 'METADATA_UPDATE';
	status: string;
	store_confirmations: StoreConfirmation[];
	created: string;
	release_owner: string;
}

interface DDXDeliveryResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: DDXDeliveryItem[];
}

export default function DDXDeliveryPage() {
	const [data, setData] = useState<DDXDeliveryResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState('');
	const pageSize = 10;

	useEffect(() => {
		fetchData();
	}, [currentPage, searchTerm]);

	const fetchData = async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/admin/ddexDelivery?page=${currentPage}&page_size=${pageSize}&search=${searchTerm}`
			);
			if (!response.ok) {
				throw new Error('Error al cargar los datos');
			}
			const jsonData = await response.json();
			console.log('jsonData: ', jsonData);
			setData(jsonData.data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error desconocido');
		} finally {
			setLoading(false);
		}
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleSearch = (value: string) => {
		setSearchTerm(value);
		setCurrentPage(1); // Reset to first page when searching
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<div className="text-red-500">Error: {error}</div>
			</div>
		);
	}

	if (!data || data.count === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64">
				<div className="text-gray-500 text-2xl font-bold mb-2">
					No hay entregas DDX-Delivery
				</div>
				<p className="text-gray-400">
					No se encontraron registros de DDX-Delivery en el sistema.
				</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">DDX-Delivery</h1>
				<div className="w-64">
					<SearchInput
						placeholder="Buscar..."
						value={searchTerm}
						onChange={handleSearch}
						className="w-full"
					/>
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full bg-white rounded-lg overflow-hidden">
					<thead className="bg-gray-100">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Release Name
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								UPC
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Action
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Store Confirmations
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Created
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Release Owner
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200">
						{data.results.map(item => (
							<tr key={item.id} className="hover:bg-gray-50">
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{item.release_name}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{item.upc}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{item.action}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{item.status}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									<div className="space-y-1">
										{item.store_confirmations.map((confirmation, index) => (
											<div key={index} className="flex items-center space-x-2">
												<span>{confirmation.store}:</span>
												<span
													className={`px-2 py-1 rounded text-xs ${
														confirmation.status
															? 'bg-green-100 text-green-800'
															: 'bg-red-100 text-red-800'
													}`}
												>
													{confirmation.status ? 'OK' : 'Error'}
												</span>
											</div>
										))}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{format(new Date(item.created), 'PPP', { locale: es })}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{item.release_owner}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="mt-4">
				<Pagination
					currentPage={currentPage}
					totalItems={data.count}
					itemsPerPage={pageSize}
					totalPages={Math.ceil(data.count / pageSize)}
					onPageChange={handlePageChange}
				/>
			</div>
		</div>
	);
}
