import React from 'react';
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
	return (
		<div className={`relative ${className}`}>
			<select
				value={value}
				onChange={e => onChange(e.target.value)}
				className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent appearance-none bg-white cursor-pointer transition-all duration-200"
			>
				{options.map(option => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			<ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
		</div>
	);
};

export default SortSelect;
