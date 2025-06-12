'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { PlusCircle, Pencil, Trash2, LogIn } from 'lucide-react';

interface Log {
	_id: string;
	action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
	entity: 'USER' | 'PRODUCT' | 'RELEASE' | 'TRACK';
	entityId: string;
	userId: string;
	userName: string;
	userRole: string;
	details: string;
	ipAddress: string;
	createdAt: string;
	updatedAt: string;
}

interface Pagination {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

const actionColors = {
	CREATE: 'bg-green-100 text-green-800',
	UPDATE: 'bg-blue-100 text-blue-800',
	DELETE: 'bg-red-100 text-red-800',
	LOGIN: 'bg-purple-100 text-purple-800',
} as const;

const actionIcons = {
	CREATE: PlusCircle,
	UPDATE: Pencil,
	DELETE: Trash2,
	LOGIN: LogIn,
} as const;

type ActionType = keyof typeof actionColors;

export default function Logs() {
	const { user } = useAuth();
	const [logs, setLogs] = useState<Log[]>([]);
	const [pagination, setPagination] = useState<Pagination>({
		total: 0,
		page: 1,
		limit: 10,
		totalPages: 0,
	});
	const [selectedAction, setSelectedAction] = useState<ActionType | 'ALL'>(
		'ALL'
	);
	const [selectedEntity, setSelectedEntity] = useState('ALL');
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchLogs = async () => {
		try {
			setLoading(true);
			setError(null);

			const queryParams = new URLSearchParams({
				page: pagination.page.toString(),
				limit: pagination.limit.toString(),
				...(selectedAction !== 'ALL' && { action: selectedAction }),
				...(selectedEntity !== 'ALL' && { entity: selectedEntity }),
				...(searchTerm && { search: searchTerm }),
			});

			const response = await fetch(`/api/admin/getLogs?${queryParams}`, {
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error('Error al obtener los logs');
			}

			const data = await response.json();
			setLogs(data.logs);
			setPagination(data.pagination);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error al cargar los logs');
			console.error('Error fetching logs:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLogs();
	}, [pagination.page, selectedAction, selectedEntity, searchTerm]);

	const handlePageChange = (newPage: number) => {
		setPagination(prev => ({ ...prev, page: newPage }));
	};

	return (
		<div className="min-h-screen px-4 py-6 sm:px-6 md:px-6">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
						Registro de Actividades
					</h1>
				</div>

				{/* Filtros */}
				<div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Acción
							</label>
							<select
								value={selectedAction}
								onChange={e =>
									setSelectedAction(e.target.value as ActionType | 'ALL')
								}
								className="w-full rounded-md border border-gray-300 px-3 py-2"
							>
								<option value="ALL">Todas las acciones</option>
								<option value="CREATE">Crear</option>
								<option value="UPDATE">Actualizar</option>
								<option value="DELETE">Eliminar</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Entidad
							</label>
							<select
								value={selectedEntity}
								onChange={e => setSelectedEntity(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2"
							>
								<option value="ALL">Todas las entidades</option>
								<option value="USER">Usuarios</option>
								<option value="PRODUCT">Productos</option>
								<option value="RELEASE">Releases</option>
								<option value="TRACK">Tracks</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Buscar
							</label>
							<input
								type="text"
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								placeholder="Buscar en detalles o usuario..."
								className="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
					</div>
				</div>

				{/* Tabla de Logs */}
				<div className="bg-white rounded-lg shadow-sm overflow-hidden">
					{loading ? (
						<div className="p-4 text-center">Cargando...</div>
					) : error ? (
						<div className="p-4 text-center text-red-600">{error}</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Fecha
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Acción
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Entidad
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Usuario
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Rol
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Detalles
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											IP
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{logs.map(log => (
										<tr key={log._id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{format(new Date(log.createdAt), 'PPpp', {
													locale: es,
												})}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2">
													{React.createElement(actionIcons[log.action], {
														size: 16,
														className: actionColors[log.action].split(' ')[1],
													})}
													<span
														className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
															actionColors[log.action]
														}`}
													>
														{log.action}
													</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{log.entity}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{log.userName}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{log.userRole}
											</td>
											<td className="px-6 py-4 text-sm text-gray-500">
												{log.details}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{log.ipAddress}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Paginación */}
				<div className="flex justify-between items-center bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
					<div className="flex-1 flex justify-between sm:hidden">
						<button
							onClick={() => handlePageChange(pagination.page - 1)}
							disabled={pagination.page === 1}
							className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
						>
							Anterior
						</button>
						<button
							onClick={() => handlePageChange(pagination.page + 1)}
							disabled={pagination.page === pagination.totalPages}
							className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
						>
							Siguiente
						</button>
					</div>
					<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
						<div>
							<p className="text-sm text-gray-700">
								Mostrando{' '}
								<span className="font-medium">
									{(pagination.page - 1) * pagination.limit + 1}
								</span>{' '}
								a{' '}
								<span className="font-medium">
									{Math.min(
										pagination.page * pagination.limit,
										pagination.total
									)}
								</span>{' '}
								de <span className="font-medium">{pagination.total}</span>{' '}
								resultados
							</p>
						</div>
						<div>
							<nav
								className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
								aria-label="Pagination"
							>
								<button
									onClick={() => handlePageChange(pagination.page - 1)}
									disabled={pagination.page === 1}
									className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
								>
									Anterior
								</button>
								<button
									onClick={() => handlePageChange(pagination.page + 1)}
									disabled={pagination.page === pagination.totalPages}
									className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
								>
									Siguiente
								</button>
							</nav>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
