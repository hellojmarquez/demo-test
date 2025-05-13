'use client';
import React, { useEffect, useState } from 'react';

const Page = () => {
	const [tracks, setTracks] = useState<any[]>([]);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formData, setFormData] = useState<any>({});

	useEffect(() => {
		fetch('/api/admin/getAllTracks')
			.then(res => res.json())
			.then(data => setTracks(data.singleTracks || []))
			.catch(err => console.error(err));
	}, []);

	const handleEditClick = (track: any) => {
		setEditingId(track._id);
		setFormData(track);
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev: any) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleCancel = () => {
		setEditingId(null);
		setFormData({});
	};

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-6">SingleTracks</h1>

			<ul className="space-y-4">
				{tracks.map(track =>
					editingId === track._id ? (
						<li
							key={track._id}
							className="border p-4 rounded-xl bg-gray-50 shadow-md"
						>
							<h2 className="text-lg font-semibold mb-2">
								Editando: {track.name}
							</h2>

							<div className="grid grid-cols-2 gap-4">
								{Object.keys(formData).map(key => {
									if (
										typeof formData[key] === 'string' ||
										typeof formData[key] === 'number' ||
										typeof formData[key] === 'boolean'
									) {
										return (
											<div key={key}>
												<label className="block text-sm font-medium capitalize">
													{key}
												</label>
												<input
													type="text"
													name={key}
													value={String(formData[key])}
													onChange={handleInputChange}
													className="w-full border rounded p-2 mt-1"
												/>
											</div>
										);
									}
									return null;
								})}
							</div>

							<div className="mt-4 flex gap-2">
								<button
									className="bg-green-600 text-white px-4 py-2 rounded"
									onClick={() => {
										// Aquí podrías hacer el PUT para guardar

										setEditingId(null);
									}}
								>
									Guardar
								</button>
								<button
									className="bg-gray-400 text-white px-4 py-2 rounded"
									onClick={handleCancel}
								>
									Cancelar
								</button>
							</div>
						</li>
					) : (
						<li
							key={track._id}
							className="border p-4 rounded-xl bg-white shadow-md cursor-pointer hover:bg-gray-100"
							onClick={() => handleEditClick(track)}
						>
							<p>
								<strong>🎵 Name:</strong> {track.name}
							</p>
							<p>
								<strong>🎙 Vocals:</strong> {track.vocals}
							</p>
						</li>
					)
				)}
			</ul>
		</div>
	);
};

export default Page;
