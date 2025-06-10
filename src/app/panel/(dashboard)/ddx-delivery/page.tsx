'use client';
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StoreConfirmation {
	store: string;
	status: boolean;
}

interface DDXDelivery {
	id: number;
	release_name: string;
	upc: string;
	action: string;
	status: string;
	store_confirmations: StoreConfirmation[];
	created: string;
	release_owner: string;
}

interface DDXDeliveryResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: DDXDelivery[];
}

export default function DDXDeliveryPage() {
	const [data, setData] = useState<DDXDeliveryResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Datos de ejemplo para pruebas
	const sampleData: DDXDeliveryResponse = {
		count: 5,
		next: null,
		previous: null,
		results: [
			{
				id: 1,
				release_name: 'Summer Hits 2024',
				upc: '123456789012',
				action: 'INSERT',
				status: 'COMPLETED',
				store_confirmations: [
					{ store: 'Spotify', status: true },
					{ store: 'Apple Music', status: true },
					{ store: 'Amazon Music', status: true },
				],
				created: '2024-03-15T10:30:00.000Z',
				release_owner: 'John Doe',
			},
			{
				id: 2,
				release_name: 'Rock Classics Vol. 2',
				upc: '234567890123',
				action: 'UPDATE',
				status: 'PENDING',
				store_confirmations: [
					{ store: 'Spotify', status: true },
					{ store: 'Apple Music', status: false },
					{ store: 'Amazon Music', status: true },
				],
				created: '2024-03-14T15:45:00.000Z',
				release_owner: 'Jane Smith',
			},
			{
				id: 3,
				release_name: 'Latin Pop Mix',
				upc: '345678901234',
				action: 'INSERT',
				status: 'FAILED',
				store_confirmations: [
					{ store: 'Spotify', status: false },
					{ store: 'Apple Music', status: false },
					{ store: 'Amazon Music', status: false },
				],
				created: '2024-03-13T09:15:00.000Z',
				release_owner: 'Carlos Rodriguez',
			},
			{
				id: 4,
				release_name: 'Jazz Collection',
				upc: '456789012345',
				action: 'INSERT',
				status: 'COMPLETED',
				store_confirmations: [
					{ store: 'Spotify', status: true },
					{ store: 'Apple Music', status: true },
					{ store: 'Amazon Music', status: true },
					{ store: 'Deezer', status: true },
				],
				created: '2024-03-12T14:20:00.000Z',
				release_owner: 'Sarah Johnson',
			},
			{
				id: 5,
				release_name: 'Electronic Beats',
				upc: '567890123456',
				action: 'UPDATE',
				status: 'PENDING',
				store_confirmations: [
					{ store: 'Spotify', status: true },
					{ store: 'Apple Music', status: true },
					{ store: 'Amazon Music', status: false },
					{ store: 'Deezer', status: false },
					{ store: 'Tidal', status: true },
				],
				created: '2024-03-11T11:10:00.000Z',
				release_owner: 'Mike Wilson',
			},
		],
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch('/api/admin/ddexDelivery');
				const jsonData = await response.json();
				console.log('jsonData: ', jsonData);
				// Comentar la línea siguiente y descomentar la de sampleData para probar con datos de ejemplo
				// setData(jsonData.data);
				setData(sampleData);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Error desconocido');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="text-red-500">Error: {error}</div>
			</div>
		);
	}

	if (!data || data.count === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64">
				<div className="text-gray-500 text-lg mb-2">
					No hay entregas DDX-Delivery
				</div>
				<p className="text-gray-400">
					No se encontraron registros de DDX-Delivery en el sistema.
				</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4">
			<h1 className="text-2xl font-bold mb-6">DDX-Delivery</h1>
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Release Name
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									UPC
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Acción
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Estado
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Tiendas
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Fecha
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Propietario
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{data.results.map(item => (
								<tr key={item.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{item.release_name}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{item.upc}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
												item.action === 'INSERT'
													? 'bg-green-100 text-green-800'
													: 'bg-yellow-100 text-yellow-800'
											}`}
										>
											{item.action}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
												item.status === 'COMPLETED'
													? 'bg-green-100 text-green-800'
													: item.status === 'PENDING'
													? 'bg-yellow-100 text-yellow-800'
													: 'bg-red-100 text-red-800'
											}`}
										>
											{item.status}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										<div className="flex flex-wrap gap-1">
											{item.store_confirmations.map((confirmation, index) => (
												<span
													key={index}
													className={`px-2 py-1 text-xs rounded-full ${
														confirmation.status
															? 'bg-green-100 text-green-800'
															: 'bg-red-100 text-red-800'
													}`}
												>
													{confirmation.store}
												</span>
											))}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{format(
											new Date(item.created),
											"d 'de' MMMM 'de' yyyy 'a las' HH:mm",
											{ locale: es }
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{item.release_owner}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
