import React from 'react';
import Select from 'react-select';

interface AvailableOption {
	label: string;
	value: boolean | null;
}

interface AvailableFilterProps {
	value: boolean | null;
	onChange: (value: boolean | null) => void;
	className?: string;
	placeholder?: string;
}

const AvailableFilter: React.FC<AvailableFilterProps> = ({
	value,
	onChange,
	className = '',
	placeholder = 'Disponibilidad...',
}) => {
	const options: AvailableOption[] = [
		{ label: 'Todos', value: null },
		{ label: 'Disponible', value: true },
		{ label: 'No disponible', value: false },
	];

	return (
		<div className={className}>
			<Select
				value={options.find(option => option.value === value)}
				onChange={option => onChange(option?.value ?? null)}
				options={options}
				placeholder={placeholder}
				isClearable
				className="text-sm"
				styles={{
					control: (base, state) => ({
						...base,
						border: 'none',
						borderBottom: '2px solid #E5E7EB',
						borderRadius: '0',
						boxShadow: 'none',
						'&:hover': {
							borderBottom: '2px solid #4B5563',
						},
						minHeight: '42px',
						backgroundColor: 'white',
					}),
					menu: base => ({
						...base,
						backgroundColor: 'white',
						borderRadius: '0.375rem',
						boxShadow:
							'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
						zIndex: 50,
					}),
					option: (base, state) => ({
						...base,
						backgroundColor: state.isSelected
							? '#4B5563'
							: state.isFocused
							? '#F3F4F6'
							: 'white',
						color: state.isSelected ? 'white' : '#1F2937',
						'&:hover': {
							backgroundColor: state.isSelected ? '#4B5563' : '#F3F4F6',
						},
						cursor: 'pointer',
						padding: '8px 12px',
					}),
					placeholder: base => ({
						...base,
						color: '#64748b',
					}),
					singleValue: base => ({
						...base,
						color: '#1F2937',
					}),
				}}
			/>
		</div>
	);
};

export default AvailableFilter;
