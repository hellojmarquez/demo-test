'use client';
import React, { useState } from 'react';
import { Trash2, Plus, User } from 'lucide-react';
import Select from 'react-select';

export interface Contributor {
	contributor: number;
	name: string;
	role: number;
	role_name: string;
	order: number;
}

export interface NewContributor {
	name: string;
	role: number;
	role_name: string;
	order: number;
}

export interface ContributorData {
	external_id: number;
	name: string;
}

interface ContributorSelectorProps {
	contributors: Contributor[];
	newContributors?: NewContributor[];
	contributorData: ContributorData[];
	roles: Array<{ id: number; name: string }>;
	onContributorsChange: (contributors: Contributor[]) => void;
	onNewContributorsChange?: (newContributors: NewContributor[]) => void;
	onDeleteContributor: (index: number) => void;
	onDeleteNewContributor?: (index: number) => void;
	onCreateNewContributor?: (name: string) => void;
	reactSelectStyles?: any;
}

const ContributorSelector: React.FC<ContributorSelectorProps> = ({
	contributors,
	newContributors = [],
	contributorData,
	roles,
	onContributorsChange,
	onNewContributorsChange,
	onDeleteContributor,
	onDeleteNewContributor,
	onCreateNewContributor,
	reactSelectStyles,
}) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const handleContributorChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		const newContributors = [...contributors];
		if (!newContributors[index]) {
			newContributors[index] = {
				contributor: 0,
				name: '',
				role: 0,
				role_name: '',
				order: index,
			};
		}

		if (field === 'contributor') {
			const selectedContributor = contributorData.find(
				c => c.external_id === value
			);

			if (selectedContributor) {
				newContributors[index] = {
					...newContributors[index],
					contributor: selectedContributor.external_id,
					name: selectedContributor.name,
				};
			}
		} else if (field === 'role') {
			const selectedRole = roles.find(r => r.id === Number(value));

			if (selectedRole) {
				newContributors[index] = {
					...newContributors[index],
					role: selectedRole.id,
					role_name: selectedRole.name,
				};
			}
		} else if (field === 'order') {
			newContributors[index] = {
				...newContributors[index],
				order: Number(value),
			};
		}

		onContributorsChange(newContributors);
	};

	const handleNewContributorChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		if (!onNewContributorsChange) return;

		const updatedNewContributors = [...newContributors];
		if (!updatedNewContributors[index]) {
			updatedNewContributors[index] = {
				name: '',
				role: 0,
				role_name: '',
				order: index,
			};
		}

		if (field === 'role') {
			const selectedRole = roles.find(r => r.id === Number(value));
			if (selectedRole) {
				updatedNewContributors[index] = {
					...updatedNewContributors[index],
					role: selectedRole.id,
					role_name: selectedRole.name,
				};
			}
		} else if (field === 'order') {
			updatedNewContributors[index] = {
				...updatedNewContributors[index],
				order: Number(value),
			};
		}

		onNewContributorsChange(updatedNewContributors);
	};

	const handleCreateNewContributor = (name: string) => {
		if (onCreateNewContributor) {
			onCreateNewContributor(name);
			setIsMenuOpen(false);
		}
	};

	return (
		<div className="space-y-4 flex flex-col p-2 bg-slate-100">
			<Select
				value={null}
				onChange={selectedOption => {
					if (selectedOption) {
						const maxOrder = Math.max(
							...contributors.map(c => c.order),
							...(newContributors || []).map(c => c.order),
							-1
						);
						onContributorsChange([
							...contributors,
							{
								contributor: selectedOption.value,
								name: selectedOption.label,
								role: 0,
								role_name: '',
								order: maxOrder + 1,
							},
						]);
					}
				}}
				onMenuOpen={() => setIsMenuOpen(true)}
				onMenuClose={() => setIsMenuOpen(false)}
				menuIsOpen={isMenuOpen}
				options={contributorData.map(c => ({
					value: c.external_id,
					label: c.name,
				}))}
				placeholder={
					<div className="flex items-center gap-2">
						<Plus className="w-4 h-4" />
						<span>Seleccionar contribuidor</span>
					</div>
				}
				noOptionsMessage={({ inputValue }) => (
					<div className="p-2 text-center">
						<p className="text-sm text-gray-500 mb-2">
							No se encontraron contribuidores para "{inputValue}"
						</p>
						{onCreateNewContributor && (
							<button
								onClick={e => {
									e.preventDefault();
									e.stopPropagation();
									handleCreateNewContributor(inputValue);
								}}
								className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-500 bg-neutral-100 hover:text-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light"
							>
								<Plus className="w-4 h-4 mr-1" />
								Crear nuevo contribuidor
							</button>
						)}
					</div>
				)}
				className="react-select-container max-w-72 self-end"
				classNamePrefix="react-select"
				styles={reactSelectStyles}
			/>

			<div className="space-y-2 min-h-60 p-2">
				<div className="flex flex-wrap gap-2 items-center">
					{[...contributors]
						.sort((a, b) => a.order - b.order)
						.map((contributor, index) => (
							<div
								key={`contributor-${index}`}
								className="flex items-start justify-between p-3 bg-gray-50 w-60  rounded-lg"
							>
								<div className="flex gap-3">
									<div className="p-2 bg-white rounded-full">
										<User className="w-14 h-14 text-gray-600" />
									</div>
									<div className="flex flex-col items-center">
										<span className="font-medium text-sm">
											{contributor.name}
										</span>
										<div className="flex items-center gap-2 mt-1">
											<Select
												value={
													roles.find(r => r.id === contributor.role)
														? {
																value: contributor.role,
																label:
																	roles.find(r => r.id === contributor.role)
																		?.name || '',
														  }
														: null
												}
												onChange={selectedOption => {
													if (selectedOption) {
														handleContributorChange(
															index,
															'role',
															selectedOption.value
														);
													}
												}}
												options={roles.map(r => ({
													value: r.id,
													label: r.name,
												}))}
												styles={reactSelectStyles}
												className="w-28"
												classNamePrefix="react-select"
											/>
										</div>
										<div className="flex flex-col items-center mt-1">
											<input
												type="number"
												min={-2147483648}
												max={2147483647}
												value={contributor.order}
												onChange={e => {
													const value = parseInt(e.target.value, 10);
													handleContributorChange(
														index,
														'order',
														isNaN(value) ? 0 : value
													);
												}}
												className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:border-brand-light"
											/>
											<label className="text-xs text-gray-500">Orden</label>
										</div>
									</div>
								</div>
								<button
									onClick={() => onDeleteContributor(index)}
									className="p-2 text-gray-400 hover:text-red-600 transition-colors"
								>
									<Trash2 size={20} />
								</button>
							</div>
						))}

					{[...newContributors]
						.sort((a, b) => a.order - b.order)
						.map((contributor, index) => (
							<div
								key={`new-contributor-${index}`}
								className="flex items-start justify-between p-3 bg-gray-50 w-60 rounded-lg border-2 border-brand-light"
							>
								<div className="flex gap-3">
									<div className="p-2 bg-white rounded-full">
										<User className="w-14 h-14 text-gray-600" />
									</div>
									<div className="flex flex-col items-center">
										<span className="font-medium text-sm">
											{contributor.name}
										</span>
										<div className="flex items-center gap-2 mt-1">
											<Select
												value={
													roles.find(r => r.id === contributor.role)
														? {
																value: contributor.role,
																label:
																	roles.find(r => r.id === contributor.role)
																		?.name || '',
														  }
														: null
												}
												onChange={selectedOption => {
													if (selectedOption) {
														handleNewContributorChange(
															index,
															'role',
															selectedOption.value
														);
													}
												}}
												options={roles.map(r => ({
													value: r.id,
													label: r.name,
												}))}
												styles={reactSelectStyles}
												className="w-28"
												classNamePrefix="react-select"
											/>
										</div>
										<div className="flex flex-col items-center mt-1">
											<input
												type="number"
												min={-2147483648}
												max={2147483647}
												value={contributor.order}
												onChange={e => {
													const value = parseInt(e.target.value, 10);
													handleNewContributorChange(
														index,
														'order',
														isNaN(value) ? 0 : value
													);
												}}
												className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:border-brand-light"
											/>
											<label className="text-xs text-gray-500">Orden</label>
										</div>
									</div>
								</div>
								{onDeleteNewContributor && (
									<button
										onClick={() => onDeleteNewContributor(index)}
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

export default ContributorSelector;
