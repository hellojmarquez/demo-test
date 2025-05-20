import React from 'react';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	onPageChange: (page: number) => void;
	className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
	className = '',
}) => {
	return (
		<div className={`flex items-center justify-between ${className}`}>
			<div className="flex items-center gap-2">
				<button
					onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
					disabled={currentPage === 1}
					className="px-3 py-1 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Anterior
				</button>
				<span className="text-sm text-gray-600">
					Página {currentPage} de {totalPages}
				</span>
				<button
					onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
					disabled={currentPage === totalPages}
					className="px-3 py-1 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Siguiente
				</button>
			</div>
			<div className="text-sm text-gray-600">
				Mostrando {Math.min(totalItems, currentPage * itemsPerPage)} de{' '}
				{totalItems} items
			</div>
		</div>
	);
};

export default Pagination;
