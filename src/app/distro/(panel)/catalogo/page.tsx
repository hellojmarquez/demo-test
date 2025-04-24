'use client'

interface Producto {
  id: string
  titulo: string
  artista: string
  estado: 'pendiente' | 'activo' | 'rechazado'
}

const productosMock: Producto[] = [
  { id: '1', titulo: 'Luz del Norte', artista: 'Artista X', estado: 'activo' },
  { id: '2', titulo: 'Siente el Beat', artista: 'Artista Y', estado: 'pendiente' },
  { id: '3', titulo: 'Noche Sonora', artista: 'Artista Z', estado: 'rechazado' }
]

export default function CatalogoPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#0f4ccc]">Catálogo</h2>
      <table className="w-full bg-white rounded-md shadow text-sm overflow-hidden">
        <thead className="bg-[#0f4ccc] text-white text-left">
          <tr>
            <th className="p-3">Título</th>
            <th className="p-3">Artista</th>
            <th className="p-3">Estado</th>
          </tr>
        </thead>
        <tbody>
          {productosMock.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{p.titulo}</td>
              <td className="p-3">{p.artista}</td>
              <td className="p-3 capitalize">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded ${
                    p.estado === 'activo'
                      ? 'bg-green-100 text-green-700'
                      : p.estado === 'pendiente'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {p.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
