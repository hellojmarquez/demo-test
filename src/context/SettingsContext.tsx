'use client';
import React, { createContext, useContext } from 'react';
import useSWR from 'swr';
import { useAuth } from './AuthContext';

interface SettingsContextType {
	userData: any;
	error: any;
	isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
	undefined
);

const fetcher = async (url: string) => {
	const res = await fetch(url);
	return await res.json();
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
	const { user } = useAuth();
	const apiUrl = user?._id ? `/api/admin/getUserById/${user._id}` : null;
	const { data, error, isLoading } = useSWR(apiUrl, fetcher);

	const value = {
		userData: data?.data,
		error,
		isLoading,
	};

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettings() {
	const context = useContext(SettingsContext);
	if (context === undefined) {
		throw new Error('useSettings must be used within a SettingsProvider');
	}
	return context;
}
