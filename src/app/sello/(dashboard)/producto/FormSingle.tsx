import React, { useEffect, useState } from 'react';
type Role = {
	id: number;
	name: string;
};
type ArrayType = 'artists' | 'publishers' | 'contributors';
type FormProductsProps = {
	tipoProducto: string;
};
type Subgenre = {
	id: number;
	name: string;
};
interface Release {
	_id: string;
	name: string;
	picture: {
		base64: string;
	};
}

type Genre = {
	id: number;
	name: string;
	subgenres: Subgenre[];
};
const FormSingle = ({ tipoProducto }: FormProductsProps) => {
	const [artists, setartists] = useState<Role[]>([]);
	const [releases, setReleases] = useState<Release[]>([]);

	const [contributors, setContributors] = useState<Role[]>([]);

	const [publishers, setPublishers] = useState<Role[]>([]);
	const [singleRelease, setSingleRelease] = useState<string>('');
	const [singleOrder, setSingleOrder] = useState(0);
	const [singlename, setSinglename] = useState('');
	const [singleMixname, setSingleMixname] = useState('');
	const [singleLang, setSingleLang] = useState('');
	const [singleVocals, setSingleVocals] = useState('');
	const [roles, setRoles] = useState<Role[]>([]);
	const [labelShare, setLabelShare] = useState('');
	const [genre, setGenre] = useState<number | ''>('');
	const [subGenre, setSubGenre] = useState<number | ''>('');
	const [genres, setGenres] = useState<Genre[]>([]);
	const [resource, setResource] = useState<File | null>(null);
	const [resourceError, setResourceError] = useState<string>('');
	const [resourceDolby, setResourceDolby] = useState('');
	const [copyrightHolder, setCopyrightHolder] = useState('');
	const [copyrightHolderYear, setCopyrightHolderYear] = useState('');
	const [sampleStart, setSampleStart] = useState('');
	const [isrc, setIsrc] = useState('');
	const [daIsrc, setDaIsrc] = useState('');
	const [trackLength, setTrackLength] = useState('');
	const [singleArtists, setSingleArtists] = useState([
		{ artist: 0, kind: '', order: 0 },
	]);

	const [singlePublishers, setSinglePublishers] = useState([
		{ publisher: 0, author: '', order: 0 },
	]);
	const [checkboxState, setCheckboxState] = useState({
		albumOnly: false,
		explicitContent: false,
		generateIsrc: false,
	});
	const [singleContributors, setSingleContributors] = useState([
		{ contributor: 0, role: 0, order: 0 },
	]);
	const handleChangeSingleArray = (
		type: ArrayType,
		index: number,
		field: string,
		value: any
	) => {
		if (type === 'artists') {
			const updated = [...singleArtists];
			(updated[index] as any)[field] = value;
			setSingleArtists(updated);
		} else if (type === 'publishers') {
			const updated = [...singlePublishers];
			(updated[index] as any)[field] = value;
			setSinglePublishers(updated);
		} else if (type === 'contributors') {
			const updated = [...singleContributors];
			(updated[index] as any)[field] = value;
			setSingleContributors(updated);
		}
	};
	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setSingleRelease(event.target.value);
	};
	const handleRemoveSingleArray = (
		type: 'artists' | 'publishers' | 'contributors',
		index: number
	) => {
		if (type === 'artists') {
			const updated = [...singleArtists];
			updated.splice(index, 1);
			setSingleArtists(updated);
		} else if (type === 'publishers') {
			const updated = [...singlePublishers];
			updated.splice(index, 1);
			setSinglePublishers(updated);
		} else if (type === 'contributors') {
			const updated = [...singleContributors];
			updated.splice(index, 1);
			setSingleContributors(updated);
		}
	};
	const handleAddToSingleArray = (
		type: 'artists' | 'publishers' | 'contributors',
		newItem: any
	) => {
		if (type === 'artists') setSingleArtists([...singleArtists, newItem]);
		if (type === 'publishers')
			setSinglePublishers([...singlePublishers, newItem]);
		if (type === 'contributors')
			setSingleContributors([...singleContributors, newItem]);
	};
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.type !== 'audio/wav') {
				setResourceError('Solo se permiten archivos .wav');
				setResource(null);
				return;
			}
			setResourceError('');
			setResource(file);
		}
	};

	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		setCheckboxState(prevState => ({
			...prevState,
			[name]: checked,
		}));
	};
	const handleSingleSubmit = () => {
		const formData = new FormData();

		formData.append('order', singleOrder.toString());
		formData.append('release', singleRelease);
		formData.append('name', singlename);
		formData.append('mix_name', singleMixname);
		formData.append('language', singleLang);
		formData.append('vocals', singleVocals);
		formData.append('genre', genre.toString());
		formData.append('subgenre', subGenre.toString());

		formData.append('label_share', labelShare);
		formData.append('resource', resource as File);
		formData.append('dolby_atmos_resource', resourceDolby);
		formData.append('copyright_holder', copyrightHolder);
		formData.append('copyright_holder_year', copyrightHolderYear);
		formData.append('album_only', checkboxState.albumOnly.toString());
		formData.append('sample_start', sampleStart);
		formData.append(
			'explicit_content',
			checkboxState.explicitContent.toString()
		);
		formData.append('ISRC', isrc);
		formData.append('generate_isrc', checkboxState.generateIsrc.toString());
		formData.append('DA_ISRC', daIsrc);
		formData.append('track_lenght', trackLength.toString());

		formData.append('artists', JSON.stringify(singleArtists));
		formData.append('publishers', JSON.stringify(singlePublishers));
		formData.append('contributors', JSON.stringify(singleContributors));

		fetch('/api/admin/createSingle', {
			method: 'POST',
			body: formData,
		})
			.then(res => res.json())
			.then(r => console.log(r));
	};

	useEffect(() => {
		fetch('/api/admin/getContributorRoles')
			.then(res => res.json())
			.then(r => {
				console.log('roles', r);
				if (r?.data) {
					console.log('roles data', r.data);
					setRoles(r.data);
				} else {
					console.log('No data found for roles');
				}
			});

		fetch('/api/admin/getAllContributor')
			.then(res => res.json())
			.then(r => {
				console.log('contributors', r);
				if (r?.data) {
					console.log('contributors data', r.data);
					setContributors(r.data);
				} else {
					console.log('No data found for contributors');
				}
			});

		fetch('/api/admin/getAllPublishers')
			.then(res => res.json())
			.then(r => {
				console.log('publishers', r);
				if (r?.data) {
					console.log('publishers data', r.data);
					setPublishers(r.data);
				} else {
					console.log('No data found for publishers');
				}
			});

		fetch('/api/admin/getAllArtists')
			.then(res => res.json())
			.then(r => {
				console.log('art', r);
				if (r?.data) {
					console.log('artists data', r.data);
					setartists(r.data);
				} else {
					console.log('No data found for artists');
				}
			});

		fetch('/api/admin/getAllGenres')
			.then(res => res.json())
			.then(r => {
				console.log('genres', r);
				if (r?.data) {
					console.log('genres data', r.data);
					setGenres(r.data);
				} else {
					console.log('No data found for genres');
				}
			});

		fetch('/api/admin/getAllReleases')
			.then(res => res.json())
			.then(r => {
				console.log('releases', r);
				if (r?.data) {
					console.log('releases data', r.data);
					setReleases(r.data);
				} else {
					console.log('No data found for releases');
				}
			});
	}, []);

	const selectedGenre = Array.isArray(genres)
		? genres.find(g => g.id === genre)
		: null;
	return (
		<>
			<div>
				<select
					className="w-full border rounded px-3 py-2 text-sm"
					onChange={handleChange}
					value={singleRelease}
				>
					<option value="">Seleccionar lanzamiento</option>
					{releases.map(release => (
						<option key={release._id} value={release._id}>
							{release.name}
						</option>
					))}
				</select>

				{singleRelease && (
					<div className="w-48 h-48 border rounded overflow-hidden mt-4">
						{releases
							.filter(release => release._id === singleRelease)
							.map(release => (
								<img
									key={release._id}
									src={`data:image/jpeg;base64,${release.picture.base64}`}
									alt={`${release.name} cover`}
									className="w-full h-full object-cover"
								/>
							))}
					</div>
				)}
			</div>

			<input
				type="text"
				placeholder="orden"
				className="w-full border rounded my-2 px-3 py-2 text-sm"
				onChange={e => setSingleOrder(Number(e.target.value))}
			/>
			<input
				type="text"
				placeholder="Nombre"
				className="w-full my-2 border rounded px-3 py-2 text-sm"
				onChange={e => setSinglename(e.target.value)}
			/>
			<input
				type="text"
				placeholder="Mix Name"
				className="w-full my-2 border rounded px-3 py-2 text-sm"
				onChange={e => setSingleMixname(e.target.value)}
			/>
			<input
				type="text"
				placeholder="Language (ej. AB)"
				className="w-full my-2 border rounded px-3 py-2 text-sm"
				onChange={e => setSingleLang(e.target.value)}
			/>
			<input
				type="text"
				placeholder="Vocals (ej. ZXX)"
				className="w-full my-2 border rounded px-3 py-2 text-sm"
				onChange={e => setSingleVocals(e.target.value)}
			/>
			{/* ARTISTS */}
			<div>
				<h3 className="font-semibold mb-2 text-sm">Artistas</h3>
				{singleArtists.map((item, index) => (
					<div
						key={`artist-${item.artist}-${index}`}
						className="grid grid-cols-3 gap-2 mb-2"
					>
						<select
							value={item.artist}
							onChange={e =>
								handleChangeSingleArray(
									'artists',
									index,
									'artist',
									Number(e.target.value)
								)
							}
							className="border rounded px-2 py-1 text-sm"
						>
							<option value="">Seleccionar artista</option>
							{artists.map(artist => (
								<option key={artist.id} value={artist.id}>
									{artist.name}
								</option>
							))}
						</select>

						<select
							value={item.kind}
							onChange={e => {
								const newKind = e.target.value;

								// Solo permite un 'main', si ya hay otro marcado como 'main', no dejar cambiar
								if (
									newKind === 'main' &&
									!singleArtists.some(
										(a, i) => i !== index && a.kind === 'main'
									)
								) {
									handleChangeSingleArray('artists', index, 'kind', newKind);
								} else if (newKind !== 'main') {
									handleChangeSingleArray('artists', index, 'kind', newKind);
								}
							}}
							className="border rounded px-2 py-1 text-sm"
						>
							<option value="main">Principal</option>
							<option value="featured">Colaborador</option>
						</select>

						<button
							onClick={() => handleRemoveSingleArray('artists', index)}
							className="text-red-500 text-sm"
						>
							Eliminar
						</button>
					</div>
				))}
				<button
					onClick={() =>
						handleAddToSingleArray('artists', {
							id: 0,
							artist: 0,
							order: 0,
							kind: 'featured', // Cambiado de 'main' a 'featured'
						})
					}
					className="text-blue-500 text-sm mt-1"
				>
					+ Agregar artista
				</button>
			</div>
			{/* PUBLISHERS */}
			<div>
				{singlePublishers &&
					singlePublishers.map((item, index) => (
						<div
							key={`publisher-${item.publisher}-${index}`}
							className="grid grid-cols-3 gap-2 mb-2"
						>
							<div className="flex flex-col">
								<label
									htmlFor={`publisher-${index}`}
									className="text-xs my-2 font-semibold mb-1"
								>
									Publisher
								</label>
								<select
									id={`publisher-${index}`}
									value={item.publisher}
									onChange={e =>
										handleChangeSingleArray(
											'publishers',
											index,
											'publisher',
											Number(e.target.value)
										)
									}
									className="border rounded px-2 py-1 text-sm"
								>
									<option value="">Seleccionar publisher</option>
									{publishers &&
										publishers.map(p => (
											<option key={p.id} value={p.id}>
												{p.name}
											</option>
										))}
								</select>
							</div>
							<div className="flex flex-col">
								<label
									htmlFor={`author-${index}`}
									className="text-xs font-semibold mb-1"
								>
									Autor
								</label>
								<input
									id={`author-${index}`}
									type="text"
									placeholder="Autor"
									value={item.author}
									onChange={e =>
										handleChangeSingleArray(
											'publishers',
											index,
											'author',
											e.target.value
										)
									}
									className="border rounded px-2 py-1 text-sm"
								/>
							</div>
							<div className="flex flex-col">
								<label
									htmlFor={`order-${index}`}
									className="text-xs font-semibold mb-1"
								>
									Orden
								</label>
								<input
									id={`order-${index}`}
									type="number"
									placeholder="Orden"
									value={item.order}
									onChange={e =>
										handleChangeSingleArray(
											'publishers',
											index,
											'order',
											Number(e.target.value)
										)
									}
									className="border rounded px-2 py-1 text-sm"
								/>
							</div>
							<button
								onClick={() => handleRemoveSingleArray('publishers', index)}
								className="text-red-500 text-sm"
							>
								Eliminar
							</button>
						</div>
					))}
			</div>

			{/* CONTRIBUTORS */}
			<div>
				<h3 className="font-semibold text-sm">Contribuidores</h3>
				{singleContributors.map((item, index) => (
					<div
						key={`contributor-${item.contributor}-${item.role}-${index}`}
						className="grid grid-cols-5 gap-2 mb-4 items-end"
					>
						{/* Select de Rol */}
						<div className="flex flex-col">
							<label className="text-xs text-gray-600 mb-1">Rol</label>
							<select
								value={item.role}
								onChange={e =>
									handleChangeSingleArray(
										'contributors',
										index,
										'role',
										Number(e.target.value)
									)
								}
								className="border rounded px-2 py-1 text-sm"
							>
								<option value="">Seleccionar rol</option>
								{roles.map(role => (
									<option key={role.id} value={role.id}>
										{role.name}
									</option>
								))}
							</select>
						</div>

						{/* Select de Contribuidor */}
						<div className="flex flex-col">
							<label className="text-xs text-gray-600 mb-1">Contribuidor</label>
							<select
								value={item.contributor}
								onChange={e =>
									handleChangeSingleArray(
										'contributors',
										index,
										'contributor',
										Number(e.target.value)
									)
								}
								className="border rounded px-2 py-1 text-sm"
							>
								<option value="">Seleccionar contribuidor</option>
								{contributors &&
									contributors.length > 0 &&
									contributors.map(contributor => (
										<option key={contributor.id} value={contributor.id}>
											{contributor.name}
										</option>
									))}
							</select>
						</div>

						{/* Campo Orden */}
						<div className="flex flex-col">
							<label className="text-xs text-gray-600 mb-1">Orden</label>
							<input
								type="number"
								placeholder="order"
								value={item.order}
								onChange={e =>
									handleChangeSingleArray(
										'contributors',
										index,
										'order',
										Number(e.target.value)
									)
								}
								className="border rounded px-2 py-1 text-sm"
							/>
						</div>

						{/* Botón Eliminar */}
						<div className="flex justify-end col-span-2">
							<button
								onClick={() => handleRemoveSingleArray('contributors', index)}
								className="text-red-500 text-sm underline"
							>
								Eliminar
							</button>
						</div>
					</div>
				))}

				<button
					onClick={() =>
						handleAddToSingleArray('contributors', {
							contributor: 0,
							role: 0,
							order: 0,
						})
					}
					className="text-blue-500 text-sm mt-1"
				>
					+ Agregar contribuidor
				</button>
			</div>

			<input
				type="text"
				placeholder="Label share"
				value={labelShare}
				onChange={e => setLabelShare(e.target.value)}
				className="w-full mb-2 border rounded px-3 py-2 text-sm"
			/>
			<select
				value={genre}
				onChange={e => {
					const selectedGenreId = Number(e.target.value);
					setGenre(selectedGenreId);
					setSubGenre(''); // Reinicia subgénero al cambiar género
				}}
				className="w-full mb-2 border rounded px-3 py-2 text-sm"
			>
				<option value="">Seleccionar género</option>
				{(genres || []).map(g => (
					<option key={g.id} value={g.id}>
						{g.name}
					</option>
				))}
			</select>

			{/* Select de subgénero si existen y selectedGenre está definido */}
			{selectedGenre &&
				selectedGenre.subgenres &&
				selectedGenre.subgenres.length > 0 && (
					<select
						value={subGenre}
						onChange={e => setSubGenre(Number(e.target.value))}
						className="w-full mb-2 border rounded px-3 py-2 text-sm mt-2"
					>
						<option value="">Seleccionar subgénero</option>
						{selectedGenre.subgenres.map(sg => (
							<option key={`subgenre-${sg.id}`} value={sg.id}>
								{sg.name}
							</option>
						))}
					</select>
				)}

			<input
				type="file"
				accept=".wav,audio/wav"
				onChange={handleFileChange}
				className="w-full mb-2 border rounded px-3 py-2 text-sm"
			/>

			{resourceError && (
				<p className="text-red-500 text-sm mt-1">{resourceError}</p>
			)}

			{resource && (
				<div className="flex items-center gap-2 mt-2">
					<img src="/images/music-icon3.png" alt="Nota musical" className="" />
					<span className="text-sm">{resource.name}</span>
				</div>
			)}

			<input
				type="text"
				placeholder="Recurso Dolby atmos"
				value={resourceDolby}
				onChange={e => setResourceDolby(e.target.value)}
				className="w-full my-2 border rounded px-3 py-2 text-sm"
			/>
			<input
				type="text"
				placeholder="Copyright Holder"
				value={copyrightHolder}
				onChange={e => setCopyrightHolder(e.target.value)}
				className="w-full my-2 border rounded px-3 py-2 text-sm"
			/>
			<input
				type="text"
				placeholder="Copyright Holder año"
				value={copyrightHolderYear}
				onChange={e => setCopyrightHolderYear(e.target.value)}
				className="w-full my-2 border rounded px-3 py-2 text-sm"
			/>
			<input
				type="text"
				placeholder="Inicio sample"
				value={sampleStart}
				onChange={e => setSampleStart(e.target.value)}
				className="w-full my-2 border rounded px-3 py-2 text-sm"
			/>
			<input
				type="text"
				placeholder="ISRC"
				value={isrc}
				onChange={e => setIsrc(e.target.value)}
				className="w-full my-2 border rounded px-3 py-2 text-sm"
			/>
			<input
				type="text"
				placeholder="DA ISRC"
				value={daIsrc}
				onChange={e => setDaIsrc(e.target.value)}
				className="w-full my-2 border rounded px-3 py-2 text-sm"
			/>
			<input
				type="text"
				placeholder="Track Length"
				value={trackLength}
				onChange={e => setTrackLength(e.target.value)}
				className="w-full my-2 border rounded px-3 py-2 text-sm"
			/>

			<label className="flex items-center space-x-2 mt-2 text-sm">
				<input
					type="checkbox"
					name="albumOnly"
					checked={checkboxState.albumOnly}
					onChange={handleCheckboxChange}
				/>
				<span>Album only</span>
			</label>

			<label className="flex items-center space-x-2 text-sm">
				<input
					type="checkbox"
					name="explicitContent"
					checked={checkboxState.explicitContent}
					onChange={handleCheckboxChange}
				/>
				<span>Explicit content</span>
			</label>

			<label className="flex items-center space-x-2 text-sm">
				<input
					type="checkbox"
					name="generateIsrc"
					checked={checkboxState.generateIsrc}
					onChange={handleCheckboxChange}
				/>
				<span>Generar ISRC</span>
			</label>
			<div className="flex justify-end">
				<button
					onClick={handleSingleSubmit}
					className="bg-blue-500 text-white px-4 py-2 text-sm rounded hover:bg-blue-600"
				>
					Crear single
				</button>
			</div>
		</>
	);
};

export default FormSingle;
