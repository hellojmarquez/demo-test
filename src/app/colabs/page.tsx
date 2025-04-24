'use client'

export default function ColabsPage() {
  const productos = [
    { id: 1, titulo: 'Luz del Norte', artista: 'Artista X', rol: 'compositor' },
    { id: 2, titulo: 'Al Ritmo', artista: 'Artista Y', rol: 'productor' },
    { id: 3, titulo: 'Noche y Beat', artista: 'Artista Z', rol: 'vocal' }
  ]

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-[#0f4ccc]">Tus colaboraciones</h2>

      <p className="text-sm text-gray-600">
        Aquí puedes ver los productos donde fuiste acreditado como colaborador/a. No tienes acceso
        al catálogo completo del sello.
      </p>

      <ul className="space-y-3">
        {productos.map((p) => (
          <li key={p.id} className="bg-white rounded shadow p-4">
            <h3 className="font-medium text-[#105eca]">{p.titulo}</h3>
            <p className="text-sm text-gray-700">
              Artista principal: <strong>{p.artista}</strong>
            </p>
            <p className="text-sm text-gray-700">Tu rol: {p.rol}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
