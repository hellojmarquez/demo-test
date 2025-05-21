import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
		<div
			className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
		>
			<div className="flex items-center gap-2">
				<button
					onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
					disabled={currentPage === 1}
					className="p-2 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					aria-label="Página anterior"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="text-sm text-gray-600 hidden sm:inline">
					Página {currentPage} de {totalPages}
				</span>
				<button
					onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
					disabled={currentPage === totalPages}
					className="p-2 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					aria-label="Página siguiente"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
			<div className="text-sm text-gray-600">
				<span className="hidden sm:inline">Mostrando </span>
				{Math.min(totalItems, currentPage * itemsPerPage)} de {totalItems}
				<span className="hidden sm:inline"> items</span>
			</div>
		</div>
	);
};

export default Pagination;
