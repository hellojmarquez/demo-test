import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StoreConfirmation {
	store: string;
	status: boolean;
}

interface DDEXDeliveryConfirmations {
	id: number;
	release_name: string;
	upc: string;
	action: string;
	status: string;
	store_confirmations: StoreConfirmation[];
	created: string;
	release_owner: string;
}

interface DDEXDeliveryProps {
	ddex_delivery_confirmations?:
		| DDEXDeliveryConfirmations
		| null
		| Partial<DDEXDeliveryConfirmations>;
}

// Datos de ejemplo
const exampleData: DDEXDeliveryConfirmations = {
	id: 1,
	release_name: 'Summer Vibes 2024',
	upc: '602577784321',
	action: 'INSERT',
	status: 'SUCCESS',
	store_confirmations: [
		{
			store: 'Spotify',
			status: true,
		},
		{
			store: 'Apple Music',
			status: true,
		},
		{
			store: 'Amazon Music',
			status: true,
		},
		{
			store: 'Deezer',
			status: true,
		},
	],
	created: '2024-03-15T10:30:00.000Z',
	release_owner: 'Universal Music Group',
};

const DDEXDelivery: React.FC<DDEXDeliveryProps> = ({
	ddex_delivery_confirmations,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const {
		release_name,
		upc,
		action,
		status,
		store_confirmations,
		created,
		release_owner,
	} = exampleData;
	// if (!ddex_delivery_confirmations) {
	// 	return null; // o algún componente de fallback
	// }
	// const {
	// 	release_name,
	// 	upc,
	// 	action,
	// 	status,
	// 	store_confirmations,
	// 	created,
	// 	release_owner,
	// } = ddex_delivery_confirmations;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	// Verificar el estado de las confirmaciones
	const allConfirmed = store_confirmations?.every(conf => conf.status);
	const allFailed = store_confirmations?.every(conf => !conf.status);

	const getStatusIcon = () => {
		if (allConfirmed) {
			return <CheckCircle2 className="w-4 h-4 text-green-500" />;
		} else if (allFailed) {
			return <X className="w-4 h-4 text-red-500" />;
		} else {
			return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
		}
	};

	return (
		<div
			className="relative inline-block"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="flex items-center gap-2">
				<span className="text-blue-600 cursor-pointer hover:text-blue-800 text-sm">
					Distribución
				</span>
				{getStatusIcon()}
			</div>

			{isHovered && (
				<div className="flex z-50 left-0 mt-2 max-w-fit p-3 border rounded-lg shadow-lg bg-white">
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<h2 className="text-[10px] font-semibold">{release_name}</h2>
							<span
								className={`px-2 py-0.5 rounded text-[8px] ${
									status === 'SUCCESS'
										? 'bg-green-100 text-green-800'
										: status === 'ERROR'
										? 'bg-red-100 text-red-800'
										: 'bg-gray-100 text-gray-800'
								}`}
							>
								{status}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<p className="text-[8px] text-gray-600">UPC</p>
								<p className="text-[8px] font-medium">{upc}</p>
							</div>
							<div>
								<p className="text-[8px] text-gray-600">Action</p>
								<p className="text-[8px] font-medium">{action}</p>
							</div>
							<div>
								<p className="text-[8px] text-gray-600">Release Owner</p>
								<p className="text-[8px] font-medium">{release_owner}</p>
							</div>
							<div>
								<p className="text-[8px] text-gray-600">Created</p>
								<p className="text-[8px] font-medium">
									{created && formatDate(created)}
								</p>
							</div>
						</div>

						<div>
							<p className="text-[8px] text-gray-600 mb-1">
								Store Confirmations
							</p>
							<div className="space-y-1">
								{store_confirmations?.map((confirmation, index) => (
									<div
										key={index}
										className="flex justify-between items-center bg-gray-50 p-1.5 rounded"
									>
										<span className="text-[8px] font-medium">
											{confirmation.store}
										</span>
										{confirmation.status ? (
											<CheckCircle2 className="w-4 h-4 text-green-500" />
										) : (
											<X className="w-4 h-4 text-red-500" />
										)}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

// Ejemplo de uso del componente
export const DDEXDeliveryExample: React.FC = () => {
	return (
		<div className="max-w-2xl mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Ejemplo de DDEX Delivery</h1>
			<DDEXDelivery />
		</div>
	);
};

export default DDEXDelivery;
