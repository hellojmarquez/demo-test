import { User } from '@/models/UserModel';
import AccountRelationship from '@/models/AccountRelationshipModel';
import { IUser } from '@/types';

/**
 * Crea una nueva subcuenta y la vincula a una cuenta principal
 */
export async function createSubAccount(
	mainAccountId: string,
	subAccountData: Partial<IUser>,
	role: 'artist' | 'label' | 'publisher' | 'contributor',
	permissions: string[] = []
) {
	try {
		// Verificar que la cuenta principal existe
		const mainAccount = await User.findById(mainAccountId);
		if (!mainAccount) {
			throw new Error('Cuenta principal no encontrada');
		}

		// Crear la subcuenta
		const subAccount = await User.create({
			...subAccountData,
			isMainAccount: false,
			role,
			status: 'activo',
		});

		// Crear la relación
		await AccountRelationship.create({
			mainAccountId,
			subAccountId: subAccount._id,
			role,
			permissions,
			status: 'activo',
		});

		return subAccount;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Error al crear subcuenta: ${error}`);
		}
		throw new Error('Error al crear subcuenta: Error desconocido');
	}
}

/**
 * Cambia entre la cuenta principal y sus subcuentas
 */
export async function switchAccount(userId: string, targetAccountId: string) {
	try {
		// Verificar que existe una relación activa
		const relationship = await AccountRelationship.findOne({
			$or: [
				{ mainAccountId: userId, subAccountId: targetAccountId },
				{ mainAccountId: targetAccountId, subAccountId: userId },
			],
			status: 'activo',
		});

		if (!relationship) {
			throw new Error('No existe una relación activa entre las cuentas');
		}

		// Obtener la cuenta objetivo
		const targetAccount = await User.findById(targetAccountId);
		if (!targetAccount) {
			throw new Error('Cuenta objetivo no encontrada');
		}

		return {
			account: targetAccount,
			relationship,
		};
	} catch (error) {
		throw new Error(`Error al cambiar de cuenta: ${error}`);
	}
}

/**
 * Valida los permisos entre cuentas
 */
export async function validateAccountPermissions(
	mainAccountId: string,
	subAccountId: string,
	requiredPermissions: string[] = []
) {
	try {
		const relationship = await AccountRelationship.findOne({
			mainAccountId,
			subAccountId,
			status: 'activo',
		});

		if (!relationship) {
			return false;
		}

		// Si no se requieren permisos específicos, solo verificar que la relación existe
		if (requiredPermissions.length === 0) {
			return true;
		}

		// Verificar que la relación tiene todos los permisos requeridos
		return requiredPermissions.every(permission =>
			relationship.permissions.includes(permission)
		);
	} catch (error) {
		throw new Error(`Error al validar permisos: ${error}`);
	}
}

/**
 * Obtiene todas las subcuentas de una cuenta principal
 */
export async function getSubAccounts(mainAccountId: string) {
	try {
		const relationships = await AccountRelationship.find({
			mainAccountId,
			status: 'activo',
		}).populate('subAccountId');

		return relationships.map(rel => ({
			account: rel.subAccountId,
			role: rel.role,
			permissions: rel.permissions,
		}));
	} catch (error) {
		throw new Error(`Error al obtener subcuentas: ${error}`);
	}
}

/**
 * Obtiene todas las cuentas principales de una subcuenta
 */
export async function getMainAccounts(subAccountId: string) {
	try {
		const relationships = await AccountRelationship.find({
			subAccountId,
			status: 'activo',
		}).populate('mainAccountId');

		return relationships.map(rel => ({
			account: rel.mainAccountId,
			role: rel.role,
			permissions: rel.permissions,
		}));
	} catch (error) {
		throw new Error(`Error al obtener cuentas principales: ${error}`);
	}
}

/**
 * Actualiza los permisos de una relación entre cuentas
 */
export async function updateAccountPermissions(
	mainAccountId: string,
	subAccountId: string,
	newPermissions: string[]
) {
	try {
		const relationship = await AccountRelationship.findOne({
			mainAccountId,
			subAccountId,
			status: 'activo',
		});

		if (!relationship) {
			throw new Error('No existe una relación activa entre las cuentas');
		}

		relationship.permissions = newPermissions;
		await relationship.save();

		return relationship;
	} catch (error) {
		throw new Error(`Error al actualizar permisos: ${error}`);
	}
}

/**
 * Desactiva una relación entre cuentas
 */
export async function deactivateAccountRelationship(
	mainAccountId: string,
	subAccountId: string
) {
	try {
		const relationship = await AccountRelationship.findOne({
			mainAccountId,
			subAccountId,
			status: 'activo',
		});

		if (!relationship) {
			throw new Error('No existe una relación activa entre las cuentas');
		}

		relationship.status = 'inactive';
		await relationship.save();

		return relationship;
	} catch (error) {
		throw new Error(`Error al desactivar relación: ${error}`);
	}
}
