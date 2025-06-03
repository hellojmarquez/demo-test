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
				};
				console.log('Updated role data:', newContributors[index]);
			}
		} else if (field === 'order') {
			newContributors[index] = {
				...newContributors[index],
				order: Number(value),
			};
		}

		console.log(
			'Final contributor data before sending:',
			newContributors[index]
		);
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
							const newContributor = {
								contributor: selectedContributor.external_id,
								name: selectedContributor.name,
								role: 0,
								role_name: '',
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
							className="flex items-start justify-between p-3 bg-gray-50 w-60 rounded-lg"
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
												console.log('Role selected:', selectedOption);
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
				</div>
			</div>
		</div>
	);
};

export default ContributorSelector;
