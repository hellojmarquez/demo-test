// /src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Phrase {
	text: string;
}

export default function LoginPage() {
	const [phrase, setPhrase] = useState<Phrase | null>(null);

	const [token, setToken] = useState('');

	const router = useRouter();

	useEffect(() => {
		fetch('/frases.json')
			.then(res => res.json())
			.then(data => {
				const today = new Date().getDate();
				setPhrase(data[today % data.length]);
			});
	}, []);

	const handleLogin = () => {
		
		switch (token) {
			case 'admin-token':
				router.push('admin/login');
				break;
			case 'sello-token':
				router.push('sello/login');
				break;
			case 'artista-token':
				router.push('artista/login');
				break;
			default:
				break;
		}
	};

	return (
		<main className="min-h-screen flex flex-col items-center justify-center bg-[#f0ecf1] px-4">
			<h1 className="text-3xl font-semibold text-[#0f4ccc] mb-2">
				Isla Sounds
			</h1>
			<p className="text-gray-700 italic text-center max-w-md mb-6">
				{phrase?.text}
			</p>

			<div className="bg-white shadow-md rounded-md p-6 w-full max-w-sm space-y-4">
				<label className="block text-sm font-medium text-gray-700">rol:</label>
				<select
					value={token}
					onChange={e => setToken(e.target.value)}
					className="w-full border border-gray-300 rounded-md p-2 text-black focus:text-blue-500"
				>
					<option className="text-black " value="">
						Selecciona un rol...
					</option>
					<option className="text-black" value="admin-token">
						Admin
					</option>
					<option className=" text-black " value="sello-token">
						Sello
					</option>
					<option className=" text-black " value="artista-token">
						Artista
					</option>
					<option className="text-black " value="multi-token">
						Admin + Sello + Artista
					</option>
				</select>

				<button
					onClick={handleLogin}
					className="w-full bg-[#0f4ccc] text-white py-2 rounded-md hover:bg-[#105eca] transition"
				>
					Iniciar sesión
				</button>
			</div>
		</main>
	);
}
