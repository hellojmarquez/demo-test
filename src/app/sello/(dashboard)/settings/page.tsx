'use client';
import { useSettings } from '@/context/SettingsContext';
import SelloProfile from './selloProfile/page';
import PublisherProfile from './publisherProfile/page';
import ArtistProfile from './artistProfile/page';

const SettingsPage = () => {
	const { userData, isLoading, error } = useSettings();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-dark"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-red-500">Error: {error}</div>
			</div>
		);
	}

	if (!userData) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-gray-500">No hay datos de usuario disponibles</div>
			</div>
		);
	}

	// Renderizar el componente correspondiente según el rol
	switch (userData.role) {
		case 'sello':
			return <SelloProfile />;
		case 'publisher':
			return <PublisherProfile />;
		case 'artist':
			return <ArtistProfile />;
		default:
			return (
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-gray-500">Rol no reconocido</div>
				</div>
			);
	}
};

export default SettingsPage;
