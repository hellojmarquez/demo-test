import React from 'react';
import Select, { SingleValue } from 'react-select';

export interface RoleOption {
	value: string;
	label: string;
}

interface RoleFilterProps {
	value: RoleOption | null;
	onChange: (selectedOption: SingleValue<RoleOption>) => void;
	className?: string;
}

const roleOptions: RoleOption[] = [
	{ value: 'todos', label: 'Todos' },
	{ value: 'admin', label: 'Admin' },
	{ value: 'artista', label: 'Artista' },
	{ value: 'contributor', label: 'Contributor' },
	{ value: 'publisher', label: 'Publisher' },
	{ value: 'sello', label: 'Sello' },
];

const RoleFilter: React.FC<RoleFilterProps> = ({
	value,
	onChange,
	className = '',
}) => {
	const selectStyles = {
		control: (base: any, state: any) => ({
			...base,
			backgroundColor: 'transparent',
			border: 'none',
			borderBottom: '2px solid #E5E7EB',
			borderRadius: '0',
			boxShadow: 'none',
			minHeight: '38px',
			'&:hover': {
				borderBottom: '2px solid #4B5563',
			},
			'&:focus-within': {
				borderBottom: '2px solid #4B5563',
				boxShadow: 'none',
			},
		}),
		option: (base: any, state: any) => ({
			...base,
			backgroundColor: state.isSelected
				? '#4B5563'
				: state.isFocused
				? '#F3F4F6'
				: 'white',
			color: state.isSelected ? 'white' : '#1F2937',
			cursor: 'pointer',
			'&:hover': {
				backgroundColor: state.isSelected ? '#4B5563' : '#F3F4F6',
			},
		}),
		menu: (base: any) => ({
			...base,
			zIndex: 9999,
			backgroundColor: 'white',
			borderRadius: '0.375rem',
			boxShadow:
				'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
		}),
		menuList: (base: any) => ({
			...base,
			padding: '0.5rem 0',
		}),
		indicatorSeparator: () => ({
			display: 'none',
		}),
		dropdownIndicator: (base: any) => ({
			...base,
			color: '#9CA3AF',
			'&:hover': {
				color: '#4B5563',
			},
		}),
		clearIndicator: (base: any) => ({
			...base,
			color: '#9CA3AF',
			'&:hover': {
				color: '#4B5563',
			},
		}),
		valueContainer: (base: any) => ({
			...base,
			padding: '0 0.5rem',
		}),
		input: (base: any) => ({
			...base,
			margin: 0,
			padding: 0,
		}),
		placeholder: (base: any) => ({
			...base,
			color: '#9CA3AF',
		}),
		singleValue: (base: any) => ({
			...base,
			color: '#1F2937',
		}),
	};

	return (
		<div className={`relative ${className}`}>
			<Select<RoleOption>
				value={value}
				onChange={onChange}
				options={roleOptions}
				placeholder="Filtrar por rol"
				isClearable
				className="react-select-container"
				classNamePrefix="react-select"
				styles={selectStyles}
			/>
		</div>
	);
};

export default RoleFilter;
