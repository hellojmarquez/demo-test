import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, XCircle, Plus, Trash2, Upload } from 'lucide-react';
import InputMask from 'react-input-mask';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-clock/dist/Clock.css';
import Cleave from 'cleave.js/react';
import 'cleave.js/dist/addons/cleave-phone.us';

interface Artist {
	external_id: number;
	name: string;
	role: string;
}

interface Contributor {
	external_id: number;
	name: string;
	role: string;
}

interface Publisher {
	external_id: number;
	name: string;
	role: string;
}

interface Role {
	id: number;
	name: string;
}

interface TrackArtist {
	artist: number;
	kind: string;
	order: number;
	name: string;
}

interface TrackContributor {
	external_id: number;
	name: string;
	role: number;
	order: number;
}

interface TrackPublisher {
	publisher: number;
	author: string;
	order: number;
}

interface Track {
	_id?: string;
	name: string;
	mix_name: string;
	DA_ISRC: string;
	ISRC: string;
	album_only: boolean;
	artists: TrackArtist[];
	contributors: TrackContributor[];
	copyright_holder: string;
	copyright_holder_year: string;
	dolby_atmos_resource: string;
	explicit_content: boolean;
	generate_isrc: boolean;
	genre: {
		id: number;
		name: string;
	};
	subgenre: {
		id: number;
		name: string;
	};
	label_share: number | null;
	language: string;
	order: number | null;
	publishers: TrackPublisher[];
	release: string;
	resource: string | File | null;
	sample_start: string;
	track_lenght: string | null;
	vocals: string;
}

interface CreateTrackModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (track: Partial<Track>) => Promise<void>;
}

const CreateTrackModal: React.FC<CreateTrackModalProps> = ({
	isOpen,
	onClose,
	onSave,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [artists, setArtists] = useState<Artist[]>([]);
	const [contributors, setContributors] = useState<Contributor[]>([]);
	const [publishers, setPublishers] = useState<Publisher[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const trackLengthRef = React.useRef<HTMLInputElement>(null);
	const sampleStartRef = React.useRef<HTMLInputElement>(null);

	const [formData, setFormData] = useState<Partial<Track>>({
		name: '',
		mix_name: '',
		DA_ISRC: '',
		ISRC: '',
		album_only: false,
		artists: [],
		contributors: [],
		copyright_holder: '',
		copyright_holder_year: '',
		dolby_atmos_resource: '',
		explicit_content: false,
		generate_isrc: false,
		genre: { id: 0, name: '' },
		subgenre: { id: 0, name: '' },
		label_share: null,
		language: '',
		order: null,
		publishers: [],
		release: '',
		resource: null,
		sample_start: '',
		track_lenght: null,
		vocals: '',
	});

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Fetch artists
				const artistsRes = await fetch('/api/admin/getAllArtists');
				const artistsData = await artistsRes.json();
				if (artistsData.success) {
					// Filter artists to only include those with role 'artista'
					const filteredArtists = artistsData.data.filter(
						(user: any) => user.role === 'artista'
					);
					setArtists(filteredArtists);

					// Filter contributors from the same response
					const filteredContributors = artistsData.data.filter(
						(user: any) => user.role === 'contributor'
					);
					setContributors(filteredContributors);

					// Filter publishers from the same response
					const filteredPublishers = artistsData.data
						.filter((user: any) => user.role === 'publisher')
						.map((p: { external_id: string; name: string; role: string }) => ({
							external_id: parseInt(p.external_id),
							name: p.name,
							role: p.role,
						}));
					setPublishers(filteredPublishers);
				}

				// Fetch roles
				const rolesRes = await fetch('/api/admin/getContributorRoles');
				const rolesData = await rolesRes.json();
				if (rolesData.success) {
					setRoles(rolesData.data);
				}
			} catch (err) {
				console.error('Error fetching data:', err);
				setError('Error al cargar los datos. Por favor, inténtalo de nuevo.');
			} finally {
				setIsLoading(false);
			}
		};

		if (isOpen) {
			fetchData();
		}
	}, [isOpen]);

	const handleAddArtist = () => {
		setFormData(prev => ({
			...prev,
			artists: [
				...(prev.artists || []),
				{ artist: 0, kind: '', order: (prev.artists || []).length, name: '' },
			],
		}));
	};

	const handleAddContributor = () => {
		setFormData(prev => ({
			...prev,
			contributors: [
				...(prev.contributors || []),
				{
					external_id: 0,
					name: '',
					role: 0,
					order: (prev.contributors || []).length,
				},
			],
		}));
	};

	const handleAddPublisher = () => {
		setFormData(prev => ({
			...prev,
			publishers: [
				...(prev.publishers || []),
				{ publisher: 0, author: '', order: (prev.publishers || []).length },
			],
		}));
	};

	const handleRemoveArtist = (index: number) => {
		setFormData(prev => ({
			...prev,
			artists: (prev.artists || []).filter((_, i) => i !== index),
		}));
	};

	const handleRemoveContributor = (index: number) => {
		setFormData(prev => ({
			...prev,
			contributors: (prev.contributors || []).filter((_, i) => i !== index),
		}));
	};

	const handleRemovePublisher = (index: number) => {
		setFormData(prev => ({
			...prev,
			publishers: (prev.publishers || []).filter((_, i) => i !== index),
		}));
	};

	const handleArtistChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => {
			const newArtists = [...(prev.artists || [])];
			if (!newArtists[index]) {
				newArtists[index] = { artist: 0, kind: '', order: 0, name: '' };
			}

			if (field === 'artist' && typeof value === 'string') {
				const selectedArtist = artists.find(
					a => a.external_id === parseInt(value)
				);
				if (selectedArtist) {
					newArtists[index] = {
						...newArtists[index],
						artist: parseInt(value),
						name: selectedArtist.name,
					};
				}
			} else if (field === 'kind' || field === 'order') {
				newArtists[index] = { ...newArtists[index], [field]: value };
			}

			return { ...prev, artists: newArtists };
		});
	};

	const handleContributorChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => {
			const newContributors = [...(prev.contributors || [])];
			if (!newContributors[index]) {
				newContributors[index] = {
					external_id: 0,
					name: '',
					role: 0,
					order: 0,
				};
			}

			if (field === 'name') {
				const selectedContributor = contributors.find(c => c.name === value);
				if (selectedContributor) {
					newContributors[index] = {
						...newContributors[index],
						external_id: selectedContributor.external_id,
						name: selectedContributor.name,
					};
				}
			} else if (field === 'role' || field === 'order') {
				newContributors[index] = {
					...newContributors[index],
					[field]: typeof value === 'string' ? parseInt(value) : value,
				};
			}

			return { ...prev, contributors: newContributors };
		});
	};

	const handlePublisherChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		setFormData(prev => {
			const newPublishers = [...(prev.publishers || [])];
			if (!newPublishers[index]) {
				newPublishers[index] = { publisher: 0, author: '', order: 0 };
			}

			if (field === 'publisher') {
				const numValue =
					typeof value === 'string' ? parseInt(value) : Number(value);
				if (!isNaN(numValue)) {
					const selectedPublisher = publishers.find(
						p => p.external_id === numValue
					);
					if (selectedPublisher) {
						newPublishers[index] = {
							...newPublishers[index],
							publisher: selectedPublisher.external_id,
							author: selectedPublisher.name || '',
						};
					}
				}
			} else if (field === 'author') {
				newPublishers[index] = {
					...newPublishers[index],
					author: (value as string) || '',
				};
			} else if (field === 'order') {
				const numValue =
					typeof value === 'string' ? parseInt(value) : Number(value);
				if (!isNaN(numValue)) {
					newPublishers[index] = {
						...newPublishers[index],
						order: numValue,
					};
				}
			}

			return { ...prev, publishers: newPublishers };
		});
	};

	const handleTimeChange = (name: string, value: string) => {
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value } = e.target;

		if (name === 'label_share') {
			const numericValue = value === '' ? null : parseFloat(value);
			setFormData(prev => ({
				...prev,
				label_share: numericValue,
			}));
		} else if (name === 'track_lenght' || name === 'sample_start') {
			// Handle time input change
			handleTimeChange(name, value);
		} else {
			setFormData(prev => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			await onSave(formData as Track);
			onClose();
		} catch (err: any) {
			setError(err.message || 'Error al crear el track');
		} finally {
			setIsLoading(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type === 'audio/wav' || file.name.endsWith('.wav')) {
				setSelectedFile(file);
				console.log(file);
				setFormData(prev => ({
					...prev,
					resource: file,
				}));
				setUploadProgress(0);
			} else {
				alert('Por favor, selecciona un archivo WAV válido');
				e.target.value = '';
			}
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
					>
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold">Crear Track</h2>
							<button
								onClick={onClose}
								className="text-gray-500 hover:text-gray-700"
							>
								<X size={24} />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="space-y-6">
							{error && (
								<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
									{error}
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Nombre
									</label>
									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Mix Name
									</label>
									<input
										type="text"
										name="mix_name"
										value={formData.mix_name}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										DA ISRC
									</label>
									<input
										type="text"
										name="DA_ISRC"
										value={formData.DA_ISRC}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										ISRC
									</label>
									<input
										type="text"
										name="ISRC"
										value={formData.ISRC}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Album Only
									</label>
									<input
										type="checkbox"
										name="album_only"
										checked={formData.album_only}
										onChange={handleChange}
										className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Copyright Holder
									</label>
									<input
										type="text"
										name="copyright_holder"
										value={formData.copyright_holder}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Copyright Holder Year
									</label>
									<input
										type="text"
										name="copyright_holder_year"
										value={formData.copyright_holder_year}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Dolby Atmos Resource
									</label>
									<input
										type="text"
										name="dolby_atmos_resource"
										value={formData.dolby_atmos_resource}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Explicit Content
									</label>
									<input
										type="checkbox"
										name="explicit_content"
										checked={formData.explicit_content}
										onChange={handleChange}
										className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Generate ISRC
									</label>
									<input
										type="checkbox"
										name="generate_isrc"
										checked={formData.generate_isrc}
										onChange={handleChange}
										className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Genre
									</label>
									<select
										name="genre"
										value={formData.genre?.id}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										<option value="">Select a genre</option>
										{/* Add genre options here */}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Subgenre
									</label>
									<select
										name="subgenre"
										value={formData.subgenre?.id}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										<option value="">Select a subgenre</option>
										{/* Add subgenre options here */}
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Label Share
									</label>
									<input
										type="number"
										name="label_share"
										value={formData.label_share || ''}
										onChange={handleChange}
										step="0.01"
										min="0"
										max="100"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Language
									</label>
									<input
										type="text"
										name="language"
										value={formData.language}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Order
									</label>
									<input
										type="number"
										name="order"
										value={formData.order || ''}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Release
									</label>
									<input
										type="text"
										name="release"
										value={formData.release}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Track Length
									</label>
									<Cleave
										options={{
											time: true,
											timePattern: ['h', 'm', 's'],
											timeFormat: 'HH:mm:ss',
											blocks: [2, 2, 2],
											delimiter: ':',
										}}
										name="track_lenght"
										value={formData.track_lenght || ''}
										onChange={e =>
											handleTimeChange('track_lenght', e.target.value)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="00:00:00"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Sample Start
									</label>
									<Cleave
										options={{
											time: true,
											timePattern: ['h', 'm', 's'],
											timeFormat: 'HH:mm:ss',
											blocks: [2, 2, 2],
											delimiter: ':',
										}}
										name="sample_start"
										value={formData.sample_start}
										onChange={e =>
											handleTimeChange('sample_start', e.target.value)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="00:00:00"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Vocals
									</label>
									<input
										type="text"
										name="vocals"
										value={formData.vocals}
										onChange={handleChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							{/* Artists Section */}
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<h3 className="text-lg font-medium text-gray-900">
										Artistas
									</h3>
									<button
										type="button"
										onClick={handleAddArtist}
										className="p-2 text-brand-light hover:text-brand-dark rounded-full"
									>
										<Plus size={20} />
									</button>
								</div>
								<div className="space-y-4">
									{formData.artists?.length === 0 ? (
										<div className="flex items-center gap-2">
											<select
												value={formData.artists?.[0]?.artist ?? ''}
												onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
													const value = e.target.value;
													if (value) {
														handleArtistChange(0, 'artist', value);
													}
												}}
												className="flex-1 p-2 border rounded"
											>
												<option value="">Select Artist</option>
												{artists?.map(a => (
													<option
														key={`artist-${a?.external_id || ''}`}
														value={a?.external_id || ''}
													>
														{a?.name || ''}
													</option>
												))}
											</select>

											<select
												value={formData.artists?.[0]?.kind ?? ''}
												onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
													handleArtistChange(0, 'kind', e.target.value);
												}}
												className="flex-1 p-2 border rounded"
											>
												<option value="">Select Kind</option>
												<option value="main">Main</option>
												<option value="featuring">Featuring</option>
												<option value="remixer">Remixer</option>
											</select>

											<input
												type="number"
												value={
													typeof formData.artists?.[0]?.order === 'number'
														? formData.artists[0].order
														: 0
												}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													const val = parseInt(e.target.value);
													handleArtistChange(0, 'order', isNaN(val) ? 0 : val);
												}}
												className="w-20 p-2 border rounded"
												placeholder="Order"
											/>
										</div>
									) : (
										formData.artists?.map((artist, index) => (
											<div key={index} className="flex items-center gap-2">
												<select
													value={artist.artist ?? ''}
													onChange={(
														e: React.ChangeEvent<HTMLSelectElement>
													) => {
														const value = e.target.value;
														if (value) {
															handleArtistChange(index, 'artist', value);
														}
													}}
													className="flex-1 p-2 border rounded"
												>
													<option value="">Select Artist</option>
													{artists?.map(a => (
														<option
															key={`artist-${a?.external_id || ''}`}
															value={a?.external_id || ''}
														>
															{a?.name || ''}
														</option>
													))}
												</select>

												<select
													value={artist.kind ?? ''}
													onChange={(
														e: React.ChangeEvent<HTMLSelectElement>
													) => {
														handleArtistChange(index, 'kind', e.target.value);
													}}
													className="flex-1 p-2 border rounded"
												>
													<option value="">Select Kind</option>
													<option value="main">Main</option>
													<option value="featuring">Featuring</option>
													<option value="remixer">Remixer</option>
												</select>

												<input
													type="number"
													value={
														typeof artist.order === 'number' ? artist.order : 0
													}
													onChange={(
														e: React.ChangeEvent<HTMLInputElement>
													) => {
														const val = parseInt(e.target.value);
														handleArtistChange(
															index,
															'order',
															isNaN(val) ? 0 : val
														);
													}}
													className="w-20 p-2 border rounded"
													placeholder="Order"
												/>

												{formData.artists && formData.artists.length > 1 && (
													<button
														onClick={() => handleRemoveArtist(index)}
														className="p-2 text-red-600 hover:text-red-800"
													>
														<Trash2 size={20} />
													</button>
												)}
											</div>
										))
									)}
								</div>
							</div>

							{/* Contributors Section */}
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<h3 className="text-lg font-medium text-gray-900">
										Contributors
									</h3>
									<button
										type="button"
										onClick={handleAddContributor}
										className="p-2 text-brand-light hover:text-brand-dark rounded-full"
									>
										<Plus size={20} />
									</button>
								</div>
								<div className="space-y-4">
									{formData.contributors?.length === 0 ? (
										<div className="flex items-center gap-2">
											<select
												value={formData.contributors?.[0]?.name || ''}
												onChange={e => {
													const selectValue = e.target.value;
													if (selectValue && selectValue !== '') {
														handleContributorChange(0, 'name', selectValue);
													}
												}}
												className="flex-1 p-2 border rounded"
											>
												<option value="">Select Contributor</option>
												{contributors?.map((c, idx) => (
													<option
														key={`contributor-0-${idx}-${c?.name || 'empty'}`}
														value={c?.name || ''}
													>
														{c?.name || ''}
													</option>
												))}
											</select>

											<select
												value={formData.contributors?.[0]?.role || ''}
												onChange={e => {
													const value = e.target.value;
													if (value && value !== '') {
														handleContributorChange(0, 'role', value);
													}
												}}
												className="flex-1 p-2 border rounded"
											>
												<option value="">Select Role</option>
												{roles?.map((r, idx) => (
													<option
														key={`role-0-${idx}-${r?.id || 'empty'}`}
														value={r?.id ? String(r.id) : ''}
													>
														{r?.name || ''}
													</option>
												))}
											</select>

											<input
												type="number"
												value={formData.contributors?.[0]?.order ?? 0}
												onChange={e => {
													const val = parseInt(e.target.value);
													if (!isNaN(val)) {
														handleContributorChange(0, 'order', val);
													}
												}}
												className="w-20 p-2 border rounded"
												placeholder="Order"
											/>
										</div>
									) : (
										formData.contributors?.map((contributor, index) => (
											<div
												key={`contributor-row-${index}`}
												className="flex items-center gap-2"
											>
												<select
													value={contributor.name || ''}
													onChange={e => {
														const selectValue = e.target.value;
														if (selectValue && selectValue !== '') {
															handleContributorChange(
																index,
																'name',
																selectValue
															);
														}
													}}
													className="flex-1 p-2 border rounded"
												>
													<option value="">Select Contributor</option>
													{contributors?.map((c, idx) => (
														<option
															key={`contributor-${index}-${idx}-${
																c?.name || 'empty'
															}`}
															value={c?.name || ''}
														>
															{c?.name || ''}
														</option>
													))}
												</select>

												<select
													value={contributor.role || ''}
													onChange={e => {
														const value = e.target.value;
														if (value && value !== '') {
															handleContributorChange(index, 'role', value);
														}
													}}
													className="flex-1 p-2 border rounded"
												>
													<option value="">Select Role</option>
													{roles?.map((r, idx) => (
														<option
															key={`role-${index}-${idx}-${r?.id || 'empty'}`}
															value={r?.id ? String(r.id) : ''}
														>
															{r?.name || ''}
														</option>
													))}
												</select>

												<input
													type="number"
													value={contributor.order ?? 0}
													onChange={e => {
														const val = parseInt(e.target.value);
														if (!isNaN(val)) {
															handleContributorChange(index, 'order', val);
														}
													}}
													className="w-20 p-2 border rounded"
													placeholder="Order"
												/>

												{formData.contributors &&
													formData.contributors.length > 1 && (
														<button
															onClick={() => handleRemoveContributor(index)}
															className="p-2 text-red-600 hover:text-red-800"
														>
															<Trash2 size={20} />
														</button>
													)}
											</div>
										))
									)}
								</div>
							</div>

							{/* Publishers Section */}
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<h3 className="text-lg font-medium text-gray-900">
										Publishers
									</h3>
									<button
										type="button"
										onClick={handleAddPublisher}
										className="p-2 text-brand-light hover:text-brand-dark rounded-full"
									>
										<Plus size={20} />
									</button>
								</div>
								<div className="space-y-4">
									{formData.publishers?.length === 0 ? (
										<div className="flex items-center gap-2">
											<select
												value={String(
													formData.publishers?.[0]?.publisher || ''
												)}
												onChange={e =>
													handlePublisherChange(
														0,
														'publisher',
														e.target.value ? parseInt(e.target.value) : 0
													)
												}
												className="flex-1 p-2 border rounded"
											>
												<option value="">Seleccionar Publisher</option>
												{publishers?.map((p, idx) => (
													<option
														key={`publisher-${p?.external_id || idx}`}
														value={String(p?.external_id || '')}
													>
														{p?.name || ''}
													</option>
												))}
											</select>

											<input
												type="text"
												name="author"
												value={formData.publishers?.[0]?.author || ''}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													handlePublisherChange(0, 'author', e.target.value);
												}}
												className="flex-1 p-2 border rounded"
												placeholder="Autor"
											/>

											<input
												type="number"
												value={formData.publishers?.[0]?.order ?? 0}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													const val = parseInt(e.target.value);
													handlePublisherChange(
														0,
														'order',
														isNaN(val) ? 0 : val
													);
												}}
												className="w-20 p-2 border rounded"
												placeholder="Orden"
											/>
										</div>
									) : (
										formData.publishers?.map((publisher, index) => (
											<div
												key={`publisher-row-${index}`}
												className="flex items-center gap-2"
											>
												<select
													value={String(publisher?.publisher || '')}
													onChange={(
														e: React.ChangeEvent<HTMLSelectElement>
													) => {
														const value = e.target.value;
														handlePublisherChange(
															index,
															'publisher',
															value ? parseInt(value) : 0
														);
													}}
													className="flex-1 p-2 border rounded"
												>
													<option value="">Seleccionar Publisher</option>
													{publishers?.map((p, idx) => (
														<option
															key={`publisher-${p?.external_id || idx}`}
															value={String(p?.external_id || '')}
														>
															{p?.name || ''}
														</option>
													))}
												</select>

												<input
													type="text"
													name="author"
													value={publisher?.author || ''}
													onChange={(
														e: React.ChangeEvent<HTMLInputElement>
													) => {
														handlePublisherChange(
															index,
															'author',
															e.target.value
														);
													}}
													className="flex-1 p-2 border rounded"
													placeholder="Autor"
												/>

												<input
													type="number"
													value={publisher?.order ?? 0}
													onChange={(
														e: React.ChangeEvent<HTMLInputElement>
													) => {
														const val = parseInt(e.target.value);
														handlePublisherChange(
															index,
															'order',
															isNaN(val) ? 0 : val
														);
													}}
													className="w-20 p-2 border rounded"
													placeholder="Orden"
												/>

												{formData.publishers &&
													formData.publishers.length > 1 && (
														<button
															onClick={() => handleRemovePublisher(index)}
															className="p-2 text-red-600 hover:text-red-800"
														>
															<Trash2 size={20} />
														</button>
													)}
											</div>
										))
									)}
								</div>
							</div>

							{/* File Upload Section */}
							<div className="space-y-4">
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
											Subir archivo
										</button>
									</div>
								</div>
								{uploadProgress > 0 && uploadProgress < 100 && (
									<div className="w-full bg-gray-200 rounded-full h-1.5">
										<div
											className="bg-brand-light h-1.5 rounded-full transition-all duration-300"
											style={{ width: `${uploadProgress}%` }}
										></div>
									</div>
								)}
								{formData.resource && (
									<div className="text-sm text-gray-500 mt-1">
										Archivo actual:{' '}
										{typeof formData.resource === 'string'
											? formData.resource
											: formData.resource.name}
									</div>
								)}
							</div>

							<div className="flex justify-end space-x-3 mt-6">
								<button
									type="button"
									onClick={onClose}
									disabled={isLoading}
									className="px-4 py-2 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
									<span className="group-hover:text-brand-dark">Cancelar</span>
								</button>
								<button
									type="submit"
									disabled={isLoading}
									className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? (
										<>
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
											<span>Creando...</span>
										</>
									) : (
										<>
											<Save className="h-4 w-4 group-hover:text-brand-dark" />
											<span className="group-hover:text-brand-dark">Crear</span>
										</>
									)}
								</button>
							</div>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default CreateTrackModal;
