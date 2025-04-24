'use client'

export default function ContabilidadPage() {
  const saldo = 1287.45

  const historial = [
    { id: 1, fecha: '2025-03-01', tipo: 'Ingreso', monto: 324.12 },
    { id: 2, fecha: '2025-02-15', tipo: 'Retiro', monto: -200.0 },
    { id: 3, fecha: '2025-01-20', tipo: 'Ingreso', monto: 490.00 }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#0f4ccc]">Contabilidad</h2>

      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Saldo actual</h3>
        <p className="text-3xl font-bold text-[#105eca] mb-4">€ {saldo.toFixed(2)}</p>
        <button className="bg-[#0f4ccc] text-white px-4 py-2 rounded hover:bg-[#105eca] transition">
          Solicitar retiro
        </button>
      </section>

      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Historial de transacciones</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Fecha</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Monto</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{item.fecha}</td>
                <td className="p-2">{item.tipo}</td>
                <td className={`p-2 ${item.monto < 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {item.monto < 0 ? '- ' : '+ '}€ {Math.abs(item.monto).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
