import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Upload, Send, Loader2 } from 'lucide-react';

interface ReleaseUserDeclarationProps {
	value: number;

	className?: string;
}

const options = [
	{
		value: 1,
		label: 'Quiero cancelar este lanzamiento',
	},
	{
		value: 2,
		label:
			'Quiero aprobar este lanzamiento, y entiendo y acepto plenamente las consecuencias legales de esta acción.',
	},
	{
		value: 3,
		label:
			'Quiero aprobar este lanzamiento en TODAS las tiendas; los resultados encontrados son 100 % idénticos a los de nuestro artista y el contenido le pertenece. Entendemos y aceptamos plenamente las consecuencias legales de esta acción.',
	},
	{
		value: 4,
		label:
			'Quiero aprobar este lanzamiento para TODAS las tiendas; este es un lanzamiento de COVERS para el cual he comprado una LICENCIA.',
	},
];

const customStyles = {
	control: (base: any) => ({
		...base,
		minHeight: '60px',
		backgroundColor: 'white',
		borderColor: '#e2e8f0',
		'&:hover': {
			borderColor: '#cbd5e1',
		},
	}),
	option: (base: any, state: { isSelected: boolean }) => ({
		...base,
		backgroundColor: state.isSelected ? '#3b82f6' : 'white',
		color: state.isSelected ? 'white' : '#1e293b',
		'&:hover': {
			backgroundColor: state.isSelected ? '#2563eb' : '#f1f5f9',
		},
		padding: '6px 16px',
		cursor: 'pointer',
	}),
	menu: (base: any) => ({
		...base,
		zIndex: 9999,
	}),
};

export const ReleaseUserDeclaration: React.FC<ReleaseUserDeclarationProps> = ({
	value: propValue,
	className,
}) => {
	const [selectedValue, setSelectedValue] = useState<number | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<{
		total: number;
		loaded: number;
		percentage: number;
		totalChunks: number;
		filesCompleted: number;
	} | null>(null);
	useEffect(() => {
		setSelectedValue(propValue);
	}, [propValue]);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file && file.type === 'application/pdf') {
			setSelectedFile(file);
		} else {
			alert('Por favor, selecciona un archivo PDF');
			event.target.value = '';
		}
	};

	const formatErrorMessage = (error: any): string => {
		if (typeof error === 'object' && error !== null) {
			return Object.entries(error)
				.map(([key, value]) => `${key}: ${value}`)
				.join('\n');
		}
		return error || 'Error al enviar la declaración';
	};
	const createChunks = (file: File, chunkSize: number = 250 * 1024) => {
		const chunks = [];
		const totalChunks = Math.ceil(file.size / chunkSize);

		for (let i = 0; i < totalChunks; i++) {
			const start = i * chunkSize;
			const end = Math.min(start + chunkSize, file.size);
			chunks.push({
				chunk: file.slice(start, end),
				index: i,
				total: totalChunks,
			});
		}

		return chunks;
	};

	// Función para subir un chunk
	const uploadChunk = async (
		chunk: Blob,
		chunkIndex: number,
		totalChunks: number,
		trackData: any,
		fileName: string
	) => {
		const formData = new FormData();
		formData.append('chunk', chunk);
		formData.append('chunkIndex', chunkIndex.toString());
		formData.append('totalChunks', totalChunks.toString());

		formData.append('data', JSON.stringify(trackData));
		formData.append('fileName', fileName);

		const response = await fetch(`/api/admin/releaseUserDeclaration`, {
			method: 'POST',
			body: formData,
		});
		if (response.ok) {
			setUploadProgress(prev => {
				if (!prev) return prev;
				const newLoaded = prev.loaded + 1;
				return {
					...prev,
					loaded: newLoaded,
					percentage: Math.floor((newLoaded / prev.totalChunks) * 100),
				};
			});
		}

		return response.json();
	};

	// Función para subir archivo completo por chunks
	const uploadFileByChunks = async (file: File, trackData: any) => {
		const chunks = createChunks(file);
		let lastResponse = null;

		for (let i = 0; i < chunks.length; i++) {
			const { chunk, index, total } = chunks[i];
			lastResponse = await uploadChunk(
				chunk,
				index,
				total,
				trackData,
				file.name
			);
		}

		return lastResponse;
	};
	const handleSubmit = async () => {
		if (selectedValue === 4) {
			if (!selectedFile) {
				setError('Por favor, selecciona un archivo PDF');
				return;
			}
		}

		setIsLoading(true);
		setError(null);

		const userDeclaration = {
			user_declaration: '',
			release: propValue.toString(),
		};
		if (selectedValue !== null) {
			userDeclaration.user_declaration = selectedValue.toString();
		}

		try {
			if (selectedFile) {
				const res = await uploadFileByChunks(selectedFile, userDeclaration);
				if (!res.success) {
					const errorMessage =
						typeof res.error === 'object'
							? Object.entries(res.error)
									.map(([key, value]) => {
										if (Array.isArray(value)) {
											// Manejar arrays de objetos como artists: [{ artist: ['error'] }]
											const arrayErrors = value
												.map((item, index) => {
													if (typeof item === 'object' && item !== null) {
														return Object.entries(item)
															.map(([nestedKey, nestedValue]) => {
																if (Array.isArray(nestedValue)) {
																	return `${nestedKey}: ${nestedValue.join(
																		', '
																	)}`;
																}
																return `${nestedKey}: ${nestedValue}`;
															})
															.join(', ');
													}
													return String(item);
												})
												.join(', ');
											return `${key}: ${arrayErrors}`;
										}
										if (typeof value === 'object' && value !== null) {
											// Manejar estructuras anidadas como { artists: [{ artist: ['error'] }] }
											const nestedErrors = Object.entries(value)
												.map(([nestedKey, nestedValue]) => {
													if (Array.isArray(nestedValue)) {
														return `${nestedKey}: ${nestedValue.join(', ')}`;
													}
													if (
														typeof nestedValue === 'object' &&
														nestedValue !== null
													) {
														return `${nestedKey}: ${Object.values(nestedValue)
															.flat()
															.join(', ')}`;
													}
													return `${nestedKey}: ${nestedValue}`;
												})
												.join(', ');
											return `${key}: ${nestedErrors}`;
										}
										return `${key}: ${value}`;
									})
									.filter(Boolean)
									.join('\n')
							: res.error;
					setError(errorMessage);
					throw new Error(errorMessage);
				}
			}
		} catch (error) {
			console.error('el error es:', error);
			setError(
				error instanceof Error
					? error.message
					: 'Error al enviar la declaración'
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={`flex flex-col gap-4 ${className}`}>
			<h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
				User declaration
			</h4>
			<Select
				value={options.find(option => option.value === selectedValue)}
				onChange={option => setSelectedValue(option?.value || 1)}
				options={options}
				styles={customStyles}
				placeholder="Select a declaration..."
				isSearchable={false}
				className="w-full"
			/>

			<div className="mt-6 flex justify-between">
				<div className="flex flex-col">
					{error && <p className="text-red-500">{error}</p>}
					{selectedValue === 4 && (
						<div className="mt-4">
							<div className="flex items-center gap-2">
								<label
									htmlFor="file-upload"
									className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-light bg-indigo-50 rounded-md hover:bg-indigo-100 cursor-pointer transition-colors"
								>
									<Upload className="h-4 w-4" />
									<span>Subir PDF</span>
									<input
										id="file-upload"
										name="file-upload"
										type="file"
										className="hidden"
										accept=".pdf"
										onChange={handleFileChange}
									/>
								</label>
								{selectedFile && (
									<span className="text-sm text-gray-600">
										{selectedFile.name}
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				<div>
					<button
						onClick={handleSubmit}
						disabled={isLoading}
						className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
							isLoading ? 'bg-blue-500' : ''
						}`}
					>
						{isLoading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin text-white" />
								<span>Enviando...</span>
							</>
						) : (
							<>
								<Send className="h-4 w-4" />
								<span>Enviar</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ReleaseUserDeclaration;
