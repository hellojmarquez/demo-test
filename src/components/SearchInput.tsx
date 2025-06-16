import React, { useState, useEffect } from 'react';
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
	const [isExpanded, setIsExpanded] = useState(false);
	const [localValue, setLocalValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			onChange(localValue);
		}, 500); // Espera 500ms después de que el usuario deje de escribir

		return () => clearTimeout(timer);
	}, [localValue, onChange]);

	return (
		<div className={`relative ${className} `}>
			<div
				className={`relative overflow-hidden transition-all duration-300 ease-in-out ${
					isExpanded ? 'w-full' : 'w-0'
				}`}
			>
				<input
					type="text"
					placeholder={placeholder}
					value={localValue}
					onChange={e => setLocalValue(e.target.value)}
					className="w-full pl-10 pr-4 py-2 border-b border-brand-light rounded-none focus:outline-none focus:border-brand-dark focus:ring-0 bg-transparent"
					autoFocus
					onBlur={() => {
						if (!localValue) {
							setIsExpanded(false);
						}
					}}
				/>
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
			</div>
			<button
				onClick={() => setIsExpanded(true)}
				className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center hover:text-brand-light transition-all duration-300 ease-in-out ${
					isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
				}`}
			>
				<Search className="h-4 w-4 text-gray-400" />
			</button>
		</div>
	);
};

export default SearchInput;
