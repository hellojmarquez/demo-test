'use client';

import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			{children}
			<Toaster position="top-right" />
		</AuthProvider>
	);
}
