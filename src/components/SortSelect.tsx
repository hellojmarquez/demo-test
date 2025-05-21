import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown } from 'lucide-react';

interface SortOption {
	label: string;
	value: string;
}

interface SortSelectProps {
	value: string;
	onChange: (value: string) => void;
	options: SortOption[];
	className?: string;
}

const SortSelect: React.FC<SortSelectProps> = ({
	value,
	onChange,
	options,
	className = '',
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const selectRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				selectRef.current &&
				!selectRef.current.contains(event.target as Node)
			) {
				setIsExpanded(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const selectedOption = options.find(option => option.value === value);

	return (
		<div className={`relative ${className}`} ref={selectRef}>
			{isExpanded ? (
				<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
					{options.map(option => (
						<button
							key={option.value}
							onClick={() => {
								onChange(option.value);
								setIsExpanded(false);
							}}
							className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${
								option.value === value ? 'text-brand-light' : 'text-gray-700'
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			) : null}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-10 h-10 flex items-center justify-center hover:text-brand-light transition-all duration-300 ease-in-out"
			>
				<ArrowUpDown className="h-4 w-4 text-gray-400" />
			</button>
		</div>
	);
};

export default SortSelect;
