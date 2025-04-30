import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Save } from 'lucide-react';

interface CreateContributorModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (contributorData: { name: string }) => Promise<void>;
}

export default function CreateContributorModal({
	isOpen,
	onClose,
	onSave,
}: CreateContributorModalProps) {
	const [name, setName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		try {
			setIsSubmitting(true);
			setError(null);

			const response = await fetch('/api/admin/createContributor', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: name.trim() }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al crear el contribuidor');
			}

			const data = await response.json();
			await onSave(data.contributor);
			setName('');
			onClose();
		} catch (err) {
			console.error('Error creating contributor:', err);
			setError(
				err instanceof Error ? err.message : 'Error creating contributor'
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black bg-opacity-50"
						onClick={onClose}
					/>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative z-10"
					>
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold text-gray-800">
								Crear Contribuidor
							</h2>
							<button
								onClick={onClose}
								className="text-gray-500 hover:text-gray-700 transition-colors"
							>
								<XCircle size={24} />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label
									htmlFor="name"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Nombre
								</label>
								<input
									type="text"
									id="name"
									value={name}
									onChange={e => setName(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Nombre del contribuidor"
									required
								/>
							</div>

							{error && <div className="text-red-500 text-sm">{error}</div>}

							<div className="flex justify-end space-x-3 mt-6">
								<button
									type="button"
									onClick={onClose}
									disabled={isSubmitting}
									className="px-4 py-2 rounded-md text-brand-light flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
									<span className="group-hover:text-brand-dark">Cancelar</span>
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-4 py-2 text-brand-light rounded-md flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSubmitting ? (
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
				</div>
			)}
		</AnimatePresence>
	);
}
