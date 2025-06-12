import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Upload, Send } from 'lucide-react';

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
	const [selectedValue, setSelectedValue] = useState(propValue);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [error, setError] = useState('');
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

	const handleSubmit = async () => {
		if (selectedValue === 4) {
			if (!selectedFile) {
				setError('Por favor, selecciona un archivo PDF');
				return;
			}
		}

		const formData = new FormData();
		formData.append('user_declaration', selectedValue.toString());
		formData.append('release', propValue.toString());

		if (selectedFile) {
			formData.append('file', selectedFile);
		}

		try {
			const response = await fetch('/api/admin/releaseUserDeclaration', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error('Error al enviar la declaración');
			}

			const data = await response.json();
			console.log('Respuesta:', data);
		} catch (error) {
			console.error('Error:', error);
			setError('Error al enviar la declaración');
		}
	};

	return (
		<div className={className + ' mt-8 space-y-4'}>
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
						className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-dark rounded-md hover:bg-brand-lightfocus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
					>
						<Send className="h-4 w-4" />
						Enviar
					</button>
				</div>
			</div>
		</div>
	);
};

export default ReleaseUserDeclaration;
