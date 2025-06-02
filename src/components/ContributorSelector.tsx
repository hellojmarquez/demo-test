import React from 'react';
import { Trash2, Plus, User } from 'lucide-react';
import Select from 'react-select';

export interface Contributor {
	contributor: number;
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
	contributorData: ContributorData[];
	roles: Array<{ id: number; name: string }>;
	onContributorsChange: (contributors: Contributor[]) => void;
	onDeleteContributor: (index: number) => void;
	reactSelectStyles?: any;
}

const ContributorSelector: React.FC<ContributorSelectorProps> = ({
	contributors,
	contributorData,
	roles,
	onContributorsChange,
	onDeleteContributor,
	reactSelectStyles,
}) => {
	const handleContributorChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		console.log('handleContributorChange - Input:', { field, value, index });
		console.log('Current contributors:', contributors);

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
			console.log('Selected contributor:', selectedContributor);
			if (selectedContributor) {
				newContributors[index] = {
					...newContributors[index],
					contributor: selectedContributor.external_id,
					name: selectedContributor.name,
				};
				console.log('Updated contributor data:', newContributors[index]);
			}
		} else if (field === 'role') {
			const selectedRole = roles.find(r => r.id === Number(value));
			console.log('Selected role:', selectedRole);
			if (selectedRole) {
				newContributors[index] = {
					...newContributors[index],
					role: selectedRole.id,
					role_name: selectedRole.name,
					name: newContributors[index].name,
					contributor: newContributors[index].contributor,
				};
				console.log('Updated role data:', newContributors[index]);
			}
		} else if (field === 'order') {
			newContributors[index] = {
				...newContributors[index],
				order: Number(value),
				name: newContributors[index].name,
				contributor: newContributors[index].contributor,
				role: newContributors[index].role,
				role_name: newContributors[index].role_name,
			};
		}

		// Asegurarse de que todos los campos requeridos estén presentes y mantengan sus valores
		const formattedContributor = {
			contributor: newContributors[index].contributor || 0,
			name: newContributors[index].name || '',
			role: newContributors[index].role || 0,
			role_name: newContributors[index].role_name || '',
			order: newContributors[index].order || index,
		};

		console.log('Final contributor data before sending:', formattedContributor);
		onContributorsChange(newContributors);
	};

	return (
		<div className="space-y-4 flex flex-col p-2 bg-slate-100">
			<Select
				value={null}
				onChange={selectedOption => {
					console.log('Select onChange - selectedOption:', selectedOption);
					if (selectedOption) {
						const selectedContributor = contributorData.find(
							c => c.external_id === selectedOption.value
						);
						console.log('Found contributor:', selectedContributor);
						if (selectedContributor) {
							// Asegurarse de que el primer rol esté seleccionado por defecto
							const defaultRole = roles[0];
							const newContributor = {
								contributor: selectedContributor.external_id,
								name: selectedContributor.name,
								role: defaultRole?.id || 0,
								role_name: defaultRole?.name || '',
								order: contributors.length,
							};
							console.log('New contributor to add:', newContributor);
							onContributorsChange([...contributors, newContributor]);
						}
					}
				}}
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
				className="react-select-container w-72 self-end"
				classNamePrefix="react-select"
				styles={reactSelectStyles}
			/>

			<div className="space-y-2 min-h-52 p-2">
				<div className="flex flex-wrap gap-2 items-center">
					{contributors.map((contributor, index) => (
						<div
							key={`contributor-${index}`}
							className="flex items-center gap-2"
						>
							<Select
								value={
									contributor.contributor
										? {
												value: contributor.contributor,
												label: contributor.name,
										  }
										: null
								}
								onChange={selectedOption => {
									if (selectedOption) {
										const selectedContributor = contributorData.find(
											c => c.external_id === selectedOption.value
										);
										if (selectedContributor) {
											handleContributorChange(
												index,
												'contributor',
												selectedOption.value
											);
										}
									}
								}}
								options={contributorData.map(c => ({
									value: c.external_id,
									label: c.name,
								}))}
								placeholder="Seleccionar contribuidor"
								className="flex-1"
								styles={reactSelectStyles}
							/>

							<Select
								value={
									contributor.role
										? {
												value: contributor.role,
												label: contributor.role_name,
										  }
										: null
								}
								onChange={selectedOption => {
									if (selectedOption) {
										const selectedRole = roles.find(
											r => r.id === selectedOption.value
										);
										if (selectedRole) {
											handleContributorChange(
												index,
												'role',
												selectedOption.value
											);
										}
									}
								}}
								options={roles.map(r => ({
									value: r.id,
									label: r.name,
								}))}
								placeholder="Seleccionar rol"
								className="flex-1"
								styles={reactSelectStyles}
							/>

							<input
								type="number"
								value={contributor.order}
								onChange={e => {
									const value = parseInt(e.target.value);
									if (!isNaN(value)) {
										handleContributorChange(index, 'order', value);
									}
								}}
								className="w-20 p-2 border rounded"
								placeholder="Orden"
							/>

							<button
								onClick={() => onDeleteContributor(index)}
								className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
							>
								<Trash2 size={20} />
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default ContributorSelector;
