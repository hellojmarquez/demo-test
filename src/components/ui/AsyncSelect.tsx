'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Select, {
	SingleValue,
	MultiValue,
	GroupBase,
	Props as SelectProps,
	components,
} from 'react-select';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export interface AsyncOption {
	value: string | number;
	label: string;
	[key: string]: any; // Allow additional properties
}

export interface AsyncSelectProps
	extends Omit<
		SelectProps<AsyncOption, boolean, GroupBase<AsyncOption>>,
		'options'
	> {
	// Required props
	loadOptions: (inputValue: string) => Promise<AsyncOption[]>;

	// Optional props
	debounceMs?: number;
	placeholder?: string;
	isMulti?: boolean;
	isClearable?: boolean;
	isSearchable?: boolean;
	isLoading?: boolean;
	noOptionsMessage?: (obj: { inputValue: string }) => React.ReactNode;
	loadingMessage?: () => string;
	errorMessage?: string;
	className?: string;
	classNamePrefix?: string;
	styles?: any;

	// Callbacks
	onInputChange?: (newValue: string, actionMeta: any) => void;
	onChange?: (
		option: SingleValue<AsyncOption> | MultiValue<AsyncOption>,
		actionMeta: any
	) => void;
}

// Custom Option component with image
const CustomOption = (props: any) => {
	const { data, isFocused, isSelected } = props;

	return (
		<components.Option {...props}>
			<div className="flex items-center gap-3 py-1">
				{data.image ? (
					<img
						src={data.image}
						alt={data.label}
						className="w-8 h-8 rounded-full object-cover"
						onError={e => {
							// Fallback to letter if image fails to load
							e.currentTarget.style.display = 'none';
							e.currentTarget.nextElementSibling?.classList.remove('hidden');
						}}
					/>
				) : null}
				{!data.image && (
					<div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
						{data.label.charAt(0).toUpperCase()}
					</div>
				)}
				<div className="flex-1">
					<div className="font-medium">{data.label}</div>
					{data.followers && (
						<div className="text-xs text-gray-500">
							{data.followers.toLocaleString()} seguidores
						</div>
					)}
				</div>
			</div>
		</components.Option>
	);
};

// Custom SingleValue component with image
const CustomSingleValue = (props: any) => {
	const { data } = props;

	return (
		<components.SingleValue {...props}>
			<div className="flex items-center gap-2">
				{data.image ? (
					<img
						src={data.image}
						alt={data.label}
						className="w-6 h-6 rounded-full object-cover"
						onError={e => {
							e.currentTarget.style.display = 'none';
							e.currentTarget.nextElementSibling?.classList.remove('hidden');
						}}
					/>
				) : null}
				{!data.image && (
					<div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
						{data.label.charAt(0).toUpperCase()}
					</div>
				)}
				<span>{data.label}</span>
			</div>
		</components.SingleValue>
	);
};

const AsyncSelect: React.FC<AsyncSelectProps> = ({
	loadOptions,
	debounceMs = 500,
	placeholder = 'Buscar...',
	isMulti = false,
	isClearable = true,
	isSearchable = true,
	isLoading: externalLoading = false,
	noOptionsMessage,
	loadingMessage = () => 'Cargando...',
	errorMessage,
	className = '',
	classNamePrefix = 'react-select',
	styles,
	onInputChange,
	onChange,
	...selectProps
}) => {
	const [options, setOptions] = useState<AsyncOption[]>([]);
	const [inputValue, setInputValue] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [url, setUrl] = useState<string | null>(null);

	// Debounced search function
	const debouncedSearch = useCallback(
		(() => {
			let timeoutId: NodeJS.Timeout;

			return (searchTerm: string) => {
				clearTimeout(timeoutId);

				timeoutId = setTimeout(async () => {
					if (!searchTerm.trim()) {
						setOptions([]);
						setIsLoading(false);
						return;
					}

					setIsLoading(true);
					setError(null);

					try {
						const results = await loadOptions(searchTerm);
						setOptions(results);

						setUrl(results[0]?.url);
					} catch (err) {
						setError(
							err instanceof Error ? err.message : 'Error al cargar opciones'
						);
						setOptions([]);
					} finally {
						setIsLoading(false);
					}
				}, debounceMs);
			};
		})(),
		[loadOptions, debounceMs]
	);

	// Handle input change
	const handleInputChange = useCallback(
		(newValue: string, actionMeta: any) => {
			setInputValue(newValue);

			// Trigger debounced search
			if (actionMeta.action === 'input-change') {
				debouncedSearch(newValue);
			}

			// Call parent onInputChange if provided
			if (onInputChange) {
				onInputChange(newValue, actionMeta);
			}
		},
		[debouncedSearch, onInputChange]
	);

	// Default no options message
	const defaultNoOptionsMessage = useCallback(
		({ inputValue }: { inputValue: string }) => {
			if (error) {
				return (
					<div className="p-2 text-center">
						<p className="text-sm text-red-500">{error}</p>
					</div>
				);
			}

			if (inputValue) {
				return (
					<div className="p-2 text-center">
						<p className="text-sm text-gray-500">
							No se encontraron resultados para "{inputValue}"
						</p>
					</div>
				);
			}

			return (
				<div className="p-2 text-center">
					<p className="text-sm text-gray-500">Escribe para buscar...</p>
				</div>
			);
		},
		[error]
	);

	// Default loading message
	const defaultLoadingMessage = useCallback(() => {
		return (
			<div className="p-2 text-center">
				<div className="flex items-center justify-center gap-2">
					<Loader2 className="w-4 h-4 animate-spin" />
					<span className="text-sm text-gray-500">{loadingMessage()}</span>
				</div>
			</div>
		);
	}, [loadingMessage]);

	return (
		<div className={className + ' mt-2'}>
			<Select<AsyncOption, boolean, GroupBase<AsyncOption>>
				{...selectProps}
				options={options}
				isMulti={isMulti}
				isClearable={isClearable}
				isSearchable={isSearchable}
				isLoading={isLoading || externalLoading}
				placeholder={placeholder}
				inputValue={inputValue}
				onInputChange={handleInputChange}
				onChange={onChange}
				noOptionsMessage={noOptionsMessage || defaultNoOptionsMessage}
				loadingMessage={defaultLoadingMessage}
				classNamePrefix={classNamePrefix}
				components={{
					Option: CustomOption,
					SingleValue: CustomSingleValue,
				}}
				styles={{
					control: (provided, state) => ({
						...provided,
						borderColor: error
							? '#ef4444'
							: state.isFocused
							? '#3b82f6'
							: '#d1d5db',
						boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
						'&:hover': {
							borderColor: error ? '#ef4444' : '#3b82f6',
						},
					}),
					option: (provided, state) => ({
						...provided,
						backgroundColor: state.isSelected
							? '#3b82f6'
							: state.isFocused
							? '#f3f4f6'
							: 'transparent',
						color: state.isSelected ? 'white' : '#374151',
						'&:hover': {
							backgroundColor: state.isSelected ? '#3b82f6' : '#f3f4f6',
						},
					}),
					...styles,
				}}
			/>
			{url && (
				<a className="text-xs text-blue-500" href={url} target="_blank">
					<p className="mt-2">Ver perfil</p>
				</a>
			)}
			{errorMessage && (
				<p className="mt-1 text-sm text-red-500">{errorMessage}</p>
			)}
		</div>
	);
};

export default AsyncSelect;
