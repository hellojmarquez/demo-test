'use client'

import { useState } from 'react'

export default function AjustesPage() {
  const [nombre, setNombre] = useState('Carlos Rivera')
  const [email, setEmail] = useState('carlos@islasounds.com')
  const [notificaciones, setNotificaciones] = useState(true)
  const [tfa, setTfa] = useState(true)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-[#0f4ccc]">Ajustes de cuenta</h2>

      <div className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nombre completo</label>
          <input
            className="w-full border rounded p-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Correo electrónico</label>
          <input
            className="w-full border rounded p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Recibir notificaciones por correo</span>
          <input
            type="checkbox"
            checked={notificaciones}
            onChange={() => setNotificaciones(!notificaciones)}
            className="w-4 h-4"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Autenticación en 2 pasos (2FA)</span>
          <input
            type="checkbox"
            checked={tfa}
            onChange={() => setTfa(!tfa)}
            className="w-4 h-4"
          />
        </div>

        <button className="bg-[#0f4ccc] text-white px-4 py-2 rounded hover:bg-[#105eca] transition">
          Guardar cambios
        </button>
      </div>
    </div>
  )
}
