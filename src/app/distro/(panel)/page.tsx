'use client'

export default function DistroHome() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#0f4ccc]">¡Bienvenido a tu panel de distribución!</h2>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Lanzamientos activos" value="24" />
        <Card title="Ingresos actuales" value="€1.942,21" />
        <Card title="Artistas vinculados" value="8" />
        <Card title="Archivos pendientes" value="3" />
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#1070c9] mt-8 mb-3">Top canciones este mes</h3>
        <ul className="bg-white rounded shadow divide-y divide-gray-200 text-sm">
          <li className="p-3 flex justify-between"><span>🎵 “Luz del Norte”</span><span>8.493 reproducciones</span></li>
          <li className="p-3 flex justify-between"><span>🎵 “Al Ritmo”</span><span>6.312 reproducciones</span></li>
          <li className="p-3 flex justify-between"><span>🎵 “Noche y Beat”</span><span>5.001 reproducciones</span></li>
        </ul>
      </section>
    </div>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded shadow flex flex-col justify-between">
      <h4 className="text-sm text-gray-600 mb-2">{title}</h4>
      <p className="text-2xl font-semibold text-[#105eca]">{value}</p>
    </div>
  )
}
