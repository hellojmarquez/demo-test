import React from 'react';
import { Trash2, Plus, User } from 'lucide-react';
import Select from 'react-select';
import CustomSwitch from './CustomSwitch';
import {
	Artist as ReleaseArtist,
	NewArtist as ReleaseNewArtist,
} from '@/types/release';

export type TrackArtist = ReleaseArtist & {
	kind: 'main' | 'featuring' | 'remixer';
};

export type TrackNewArtist = ReleaseNewArtist & {
	kind: 'main' | 'featuring' | 'remixer';
};

export interface ArtistOption {
	value: number;
	label: string;
}

interface TrackArtistSelectorProps {
	artists: TrackArtist[];
	newArtists?: TrackNewArtist[];
	artistData: Array<{ artist: number; name: string }>;
	onArtistsChange: (artists: TrackArtist[]) => void;
	onNewArtistsChange?: (newArtists: TrackNewArtist[]) => void;
	onDeleteArtist: (index: number) => void;
	onDeleteNewArtist?: (index: number) => void;
	onCreateNewArtist?: (name: string) => void;
	reactSelectStyles?: any;
}

const kindOptions = [
	{ value: 'main', label: 'Principal' },
	{ value: 'featuring', label: 'Invitado' },
	{ value: 'remixer', label: 'Remixer' },
];

const TrackArtistSelector: React.FC<TrackArtistSelectorProps> = ({
	artists,
	newArtists = [],
	artistData,
	onArtistsChange,
	onNewArtistsChange,
	onDeleteArtist,
	onDeleteNewArtist,
	onCreateNewArtist,
	reactSelectStyles,
}) => {
	return (
		<div className="space-y-4 flex flex-col p-2 bg-slate-100">
			<Select<ArtistOption>
				value={null}
				onChange={selectedOption => {
					if (selectedOption) {
						onArtistsChange([
							...artists,
							{
								order: artists.length,
								artist: selectedOption.value,
								kind: 'main',
								name: selectedOption.label,
							} as TrackArtist,
						]);
					}
				}}
				options={artistData.map(artist => ({
					value: artist.artist,
					label: artist.name,
				}))}
				placeholder={
					<div className="flex items-center gap-2">
						<Plus className="w-4 h-4" />
						<span>Seleccionar artista</span>
					</div>
				}
				noOptionsMessage={({ inputValue }) => (
					<div className="p-2 text-center">
						<p className="text-sm text-gray-500 mb-2">
							No se encontraron artistas para "{inputValue}"
						</p>
						{onCreateNewArtist && (
							<button
								onClick={() => onCreateNewArtist(inputValue)}
								className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-500 bg-neutral-100 hover:text-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light"
							>
								<Plus className="w-4 h-4 mr-1" />
								Crear nuevo artista
							</button>
						)}
					</div>
				)}
				className="react-select-container w-72 self-end"
				classNamePrefix="react-select"
				styles={reactSelectStyles}
			/>

			<div className="space-y-2 min-h-52 p-2">
				<div className="flex flex-wrap gap-2 items-center">
					{artists.map((artist, index) => (
						<div
							key={`existing-${index}`}
							className="flex items-start justify-between p-3 bg-gray-50 w-60 rounded-lg"
						>
							<div className="flex gap-3">
								<div className="p-2 bg-white rounded-full">
									<User className="w-14 h-14 text-gray-600" />
								</div>
								<div className="flex flex-col items-center">
									<span className="font-medium text-sm">{artist.name}</span>
									<div className="flex items-center gap-2 mt-1">
										<Select
											value={kindOptions.find(
												option => option.value === artist.kind
											)}
											onChange={selectedOption => {
												if (selectedOption) {
													onArtistsChange(
														artists.map((a, i) =>
															i === index
																? {
																		...a,
																		kind: selectedOption.value as
																			| 'main'
																			| 'featuring'
																			| 'remixer',
																  }
																: a
														)
													);
												}
											}}
											options={kindOptions}
											styles={reactSelectStyles}
											className="w-28"
											classNamePrefix="react-select"
										/>
									</div>
									<div className="flex items-center gap-2 mt-1">
										<input
											type="number"
											min={-2147483648}
											max={2147483647}
											value={artist.order}
											onChange={e => {
												const value = parseInt(e.target.value, 10);
												onArtistsChange(
													artists.map((a, i) =>
														i === index
															? {
																	...a,
																	order: isNaN(value) ? 0 : value,
															  }
															: a
													)
												);
											}}
											className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:border-brand-light"
										/>
										<label className="text-xs text-gray-500">Orden</label>
									</div>
								</div>
							</div>
							<button
								onClick={() => onDeleteArtist(index)}
								className="p-2 text-gray-400 hover:text-red-600 transition-colors"
							>
								<Trash2 size={20} />
							</button>
						</div>
					))}

					{newArtists.map((artist, index) => (
						<div
							key={`new-${index}`}
							className="flex items-start justify-between p-3 bg-gray-50 w-60 rounded-lg border-2 border-brand-light"
						>
							<div className="flex gap-3">
								<div className="p-2 bg-white rounded-full">
									<User className="w-14 h-14 text-gray-600" />
								</div>
								<div className="flex flex-col items-center">
									<span className="font-medium text-sm">{artist.name}</span>
									<div className="flex items-center gap-2 mt-1">
										<Select
											value={kindOptions.find(
												option => option.value === artist.kind
											)}
											onChange={selectedOption => {
												if (selectedOption && onNewArtistsChange) {
													onNewArtistsChange(
														newArtists.map((a, i) =>
															i === index
																? {
																		...a,
																		kind: selectedOption.value as
																			| 'main'
																			| 'featuring'
																			| 'remixer',
																  }
																: a
														)
													);
												}
											}}
											options={kindOptions}
											styles={reactSelectStyles}
											className="w-28"
											classNamePrefix="react-select"
										/>
									</div>
									<div className="flex items-center gap-2 mt-1">
										<input
											type="number"
											min={-2147483648}
											max={2147483647}
											value={artist.order}
											onChange={e => {
												const value = parseInt(e.target.value, 10);
												if (onNewArtistsChange) {
													onNewArtistsChange(
														newArtists.map((a, i) =>
															i === index
																? {
																		...a,
																		order: isNaN(value) ? 0 : value,
																  }
																: a
														)
													);
												}
											}}
											className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:border-brand-light"
										/>
										<label className="text-xs text-gray-500">Orden</label>
									</div>
								</div>
							</div>
							{onDeleteNewArtist && (
								<button
									onClick={() => onDeleteNewArtist(index)}
									className="p-2 text-gray-400 hover:text-red-600 transition-colors"
								>
									<Trash2 size={20} />
								</button>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default TrackArtistSelector;
