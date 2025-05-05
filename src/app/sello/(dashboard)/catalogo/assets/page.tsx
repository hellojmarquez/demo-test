import React, { useState, useEffect } from 'react';

export default function AssetsPage() {
	const [tracks, setTracks] = useState<Track[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTracks = async () => {
			setLoading(true);
			try {
				const res = await fetch('/api/admin/getAllTracks');
				const data = await res.json();
				if (data.success) {
					setTracks(data.tracks);
				}
			} catch (error) {
				console.error('Error fetching tracks:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchTracks();
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-[calc(100vh-200px)]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-dark"></div>
			</div>
		);
	}

	// ... rest of the existing code ...
}
