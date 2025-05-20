import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
	value,
	onChange,
	placeholder = 'Buscar...',
	className = '',
}) => {
	return (
		<div className={`relative ${className}`}>
			<input
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={e => onChange(e.target.value)}
				className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition-all duration-200"
			/>
			<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
		</div>
	);
};

export default SearchInput;
