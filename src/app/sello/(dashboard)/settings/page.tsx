'use client';
import React from 'react';
import ArtistProfile from './artistProfile/page';

export default function SettingsPage() {
	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-2xl font-bold">Detalles de cuenta</h1>
			<ArtistProfile />
		</div>
	);
}
