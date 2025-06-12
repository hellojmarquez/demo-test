'use client';
import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

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

// Datos de ejemplo
// const data: DDEXDeliveryConfirmations = {
// 	id: 1,
// 	release_name: 'Summer Vibes 2024',
// 	upc: '602577784321',
// 	action: 'INSERT',
// 	status: 'SUCCESS',
// 	store_confirmations: [
// 		{ store: 'Spotify', status: true },
// 		{ store: 'Apple Music', status: true },
// 		{ store: 'Amazon Music', status: true },
// 		{ store: 'Deezer', status: true },
// 	],
// 	created: '2024-03-15T10:30:00.000Z',
// 	release_owner: 'Universal Music Group',
// };

type Props = {
	params: { release: string };
};

const DDEXDeliveryPage = ({ params }: Props) => {
	const releaseId = params.release;
	const [data, setData] = useState<DDEXDeliveryConfirmations>({
		id: 0,
		release_name: '',
		status: '',
		upc: '',
		action: '',
		store_confirmations: [],
		created: '',
		release_owner: '',
	});
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			const response = await fetch(`/api/admin/ddexDeliveryById/${releaseId}`);
			const data = await response.json();
			if (!data.success) {
				setError(data.error);
			} else {
				setData(data.data);
				setError(null);
			}
		};
		fetchData();
	}, [releaseId]);

	if (error) {
		return (
			<div className="flex justify-center items-center h-screen">
				<p className="bg-red-300 px-6 py-2 rounded-lg text-red-700 ">{error}</p>
			</div>
		);
	}

	const {
		release_name,
		upc,
		action,
		status,
		store_confirmations,
		created,
		release_owner,
	} = data;
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};
	const allConfirmed = store_confirmations?.every(conf => conf.status);
	const allFailed = store_confirmations?.every(conf => !conf.status);

	const getStatusIcon = () => {
		const iconClass = 'sm:w-8 sm:h-8 w-5 h-5';
		if (allConfirmed) {
			return <CheckCircle2 className={iconClass + ' text-green-500'} />;
		} else if (allFailed) {
			return <X className={iconClass + ' text-red-500'} />;
		} else {
			return <AlertTriangle className={iconClass + ' text-yellow-500'} />;
		}
	};

	return (
		<div className="max-w-2xl mx-auto p-4">
			<h1 className="text-2xl flex items-center justify-between font-bold mb-4">
				DDEX Delivery {getStatusIcon()}
			</h1>

			<div className="border rounded-lg shadow-lg bg-white p-4">
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<h2 className="text-base font-semibold">{release_name}</h2>
						<span
							className={`px-2 py-0.5 rounded text-xs ${
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
							<p className="text-xs text-gray-600">UPC</p>
							<p className="text-xs font-medium">{upc}</p>
						</div>
						<div>
							<p className="text-xs text-gray-600">Action</p>
							<p className="text-xs font-medium">{action}</p>
						</div>
						<div>
							<p className="text-xs text-gray-600">Release Owner</p>
							<p className="text-xs font-medium">{release_owner}</p>
						</div>
						<div>
							<p className="text-xs text-gray-600">Created</p>
							<p className="text-xs font-medium">
								{created && formatDate(created)}
							</p>
						</div>
					</div>
					<div>
						<p className="text-xs text-gray-600 mb-1">Store Confirmations</p>
						<div className="space-y-1">
							{store_confirmations?.map((confirmation, index) => (
								<div
									key={index}
									className="flex justify-between items-center bg-gray-50 p-1.5 rounded"
								>
									<span className="text-xs font-medium">
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
		</div>
	);
};

export default DDEXDeliveryPage;
