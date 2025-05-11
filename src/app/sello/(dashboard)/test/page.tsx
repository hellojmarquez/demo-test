'use client';
import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

const TestPage = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Datos iniciales que espera el backend
	const [formDataObj] = useState({
		order: 0,
		release: 805,
		name: 'track 01',
		mix_name: '',
		language: 'AB',
		vocals: 'ZXX',
		artists: [{ id: 22310, order: 2147483647, artist: 1541, kind: 'main' }],
		publishers: [{ order: 3, publisher: 70, author: 'Juan Cisneros' }],
		contributors: [{ id: 555, order: 3, contributor: 1046, role: 2 }],
		label_share: '',
		genre: 3,
		subgenre: 90,
		resource: '',
		dolby_atmos_resource: '',
		copyright_holder: 'ISLA sOUNDS',
		copyright_holder_year: '2025',
		album_only: true,
		sample_start: '',
		explicit_content: true,
		ISRC: '',
		generate_isrc: true,
		DA_ISRC: '',
		track_lenght: '',
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const ext = file.name.split('.').pop()?.toLowerCase();
			if (ext === 'wav') {
				setSelectedFile(file);
				setUploadProgress(0);
				setError(null);
			} else {
				setError('Por favor, selecciona un archivo WAV válido');
				setSelectedFile(null);
				e.target.value = '';
			}
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedFile) return;

		setIsLoading(true);
		setError(null);
		setSuccess(false);

		// Normalizar nombre y tipo para garantizar .wav lowercase
		const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'wav';
		const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
		const normalizedName = `${baseName}.${ext}`;
		const correctedFile = new File([selectedFile], normalizedName, {
			type: 'audio/wav',
		});

		const payload = new FormData();
		payload.append('file', correctedFile);
		payload.append('data', JSON.stringify(formDataObj));

		// Usamos XMLHttpRequest para capturar progreso
		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/api/admin/createSingle');
		xhr.withCredentials = true;

		xhr.upload.onprogress = event => {
			if (event.lengthComputable) {
				const pct = Math.round((event.loaded / event.total) * 100);
				setUploadProgress(pct);
			}
		};

		xhr.onload = () => {
			setIsLoading(false);
			if (xhr.status >= 200 && xhr.status < 300) {
				setSuccess(true);
				setSelectedFile(null);
				if (fileInputRef.current) fileInputRef.current.value = '';
			} else {
				try {
					const resp = JSON.parse(xhr.responseText);
					setError(resp.error || 'Error al crear el track');
				} catch {
					setError('Error inesperado al procesar la respuesta');
				}
			}
		};

		xhr.onerror = () => {
			setIsLoading(false);
			setError('Error de red al subir el archivo');
		};

		xhr.send(payload);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Sección de archivo WAV */}
			<div className="w-1/3 space-y-4">
				<div className="flex items-center gap-4">
					<label className="block text-sm font-medium text-gray-700">
						Archivo WAV
					</label>
					<div>
						<input
							type="file"
							ref={fileInputRef}
							onChange={handleFileChange}
							accept=".wav"
							className="hidden"
						/>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
						>
							<Upload className="h-4 w-4 mr-2" />
							Seleccionar archivo
						</button>
					</div>
				</div>
				{uploadProgress > 0 && (
					<div className="w-full bg-gray-200 rounded-full h-1.5">
						<div
							className="bg-brand-light h-1.5 rounded-full transition-all duration-300"
							style={{ width: `${uploadProgress}%` }}
						/>
					</div>
				)}
				{selectedFile && (
					<div className="text-sm text-gray-500 mt-1">
						Archivo: {selectedFile.name}
					</div>
				)}
			</div>

			{/* Mensajes */}
			{error && <div className="text-red-500 text-sm mt-2">{error}</div>}
			{success && (
				<div className="text-green-500 text-sm mt-2">
					¡Track creado exitosamente!
				</div>
			)}

			{/* Botón Submit */}
			<button
				type="submit"
				disabled={isLoading || !selectedFile}
				className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-dark hover:bg-brand-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark ${
					(isLoading || !selectedFile) && 'opacity-50 cursor-not-allowed'
				}`}
			>
				{isLoading ? 'Creando...' : 'Crear Track'}
			</button>
		</form>
	);
};

export default TestPage;
