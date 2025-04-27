<div className="flex justify-end space-x-3 mt-6">
	<button
		type="button"
		onClick={onClose}
		className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2 group"
	>
		<XCircle className="h-4 w-4 group-hover:text-brand-dark" />
		<span className="group-hover:text-brand-dark">Cancelar</span>
	</button>
	<button
		type="submit"
		className="px-4 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-dark/90 flex items-center gap-2 group"
	>
		<Save className="h-4 w-4 group-hover:text-brand-dark" />
		<span className="group-hover:text-brand-dark">Guardar cambios</span>
	</button>
</div>;
