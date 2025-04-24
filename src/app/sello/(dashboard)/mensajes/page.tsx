'use client'

interface Mensaje {
  id: string
  asunto: string
  contenido: string
  leido: boolean
  fecha: string
}

const mensajesMock: Mensaje[] = [
  {
    id: '1',
    asunto: 'Nueva solicitud de retiro',
    contenido: 'El usuario Sello A ha solicitado un retiro de saldo.',
    leido: false,
    fecha: '2025-04-03 14:22'
  },
  {
    id: '2',
    asunto: 'Fallo en subida de archivos',
    contenido: 'Se detectó un error en la carga de archivos por parte de Subcuenta B.',
    leido: true,
    fecha: '2025-04-02 18:05'
  }
]

export default function MensajesPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#0f4ccc]">Mensajes del administrador</h2>
      <ul className="space-y-3">
        {mensajesMock.map((msg) => (
          <li key={msg.id} className={`p-4 bg-white rounded shadow ${msg.leido ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-[#1070c9]">{msg.asunto}</h3>
                <p className="text-sm text-gray-700 mt-1">{msg.contenido}</p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{msg.fecha}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
