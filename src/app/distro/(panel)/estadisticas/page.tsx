'use client'

interface Estadistica {
  producto: string
  streams: number
  descargas: number
  regalías: number
}

const dataMock: Estadistica[] = [
  { producto: 'Luz del Norte', streams: 8493, descargas: 321, regalías: 108.23 },
  { producto: 'Al Ritmo', streams: 6312, descargas: 289, regalías: 87.45 },
  { producto: 'Noche y Beat', streams: 5001, descargas: 201, regalías: 69.87 }
]

export default function EstadisticasPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#0f4ccc]">Estadísticas por producto</h2>
      <table className="w-full bg-white rounded-md shadow text-sm overflow-hidden">
        <thead className="bg-[#0f4ccc] text-white text-left">
          <tr>
            <th className="p-3">Producto</th>
            <th className="p-3">Streams</th>
            <th className="p-3">Descargas</th>
            <th className="p-3">Regalías</th>
          </tr>
        </thead>
        <tbody>
          {dataMock.map((e, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="p-3">{e.producto}</td>
              <td className="p-3">{e.streams.toLocaleString()}</td>
              <td className="p-3">{e.descargas.toLocaleString()}</td>
              <td className="p-3">€ {e.regalías.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
