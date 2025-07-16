// Tipos para el almacenamiento
type StorageKey = 'user' | 'currentAccount' | 'nextauth.message';

// Clase para manejar el almacenamiento
class StorageManager {
	private static instance: StorageManager;
	private cache: Map<string, any>;

	private constructor() {
		this.cache = new Map();
	}

	public static getInstance(): StorageManager {
		if (!StorageManager.instance) {
			StorageManager.instance = new StorageManager();
		}
		return StorageManager.instance;
	}

	// Obtener un valor del almacenamiento
	public get<T>(key: StorageKey): T | null {
		// Primero intentar obtener del caché
		if (this.cache.has(key)) {
			return this.cache.get(key);
		}

		try {
			const item = localStorage.getItem(key);
			if (!item) return null;

			const value = JSON.parse(item);
			// Guardar en caché
			this.cache.set(key, value);
			return value;
		} catch (error) {
			console.error(`Error reading from localStorage (${key}):`, error);
			return null;
		}
	}

	// Guardar un valor en el almacenamiento
	public set<T>(key: StorageKey, value: T): void {
		try {
			const serializedValue = JSON.stringify(value);
			localStorage.setItem(key, serializedValue);
			// Actualizar caché
			this.cache.set(key, value);
		} catch (error) {
			console.error(`Error saving to localStorage (${key}):`, error);
		}
	}

	// Eliminar un valor del almacenamiento
	public remove(key: StorageKey): void {
		try {
			localStorage.removeItem(key);
			// Eliminar del caché
			this.cache.delete(key);
		} catch (error) {
			console.error(`Error removing from localStorage (${key}):`, error);
		}
	}

	// Limpiar todo el almacenamiento
	public clear(): void {
		try {
			localStorage.clear();
			// Limpiar caché
			this.cache.clear();
		} catch (error) {
			console.error('Error clearing localStorage:', error);
		}
	}

	// Obtener múltiples valores
	public getMultiple<T>(keys: StorageKey[]): Record<StorageKey, T | null> {
		return keys.reduce((acc, key) => {
			acc[key] = this.get<T>(key);
			return acc;
		}, {} as Record<StorageKey, T | null>);
	}

	// Guardar múltiples valores
	public setMultiple<T>(items: Record<StorageKey, T>): void {
		Object.entries(items).forEach(([key, value]) => {
			this.set(key as StorageKey, value);
		});
	}
}

// Exportar una instancia única
export const storage = StorageManager.getInstance();
