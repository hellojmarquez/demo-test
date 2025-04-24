// /src/app/login/seleccionar-cuenta/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const mockRoles = ['admin', 'sello', 'artista'] // Esto debería venir del token en producción

export default function SeleccionarCuenta() {
  const router = useRouter()
  const [roles, setRoles] = useState<string[]>([])

  useEffect(() => {
    // Simulamos extracción de roles desde token (cookie)
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('session-token='))
      ?.split('=')[1]

    if (token === 'multi-token') {
      setRoles(['admin', 'sello', 'artista'])
    } else {
      // Si por alguna razón no hay múltiples roles, lo mandamos a login
      router.push('/')
    }
  }, [router])

  const handleSelect = (rol: string) => {
    // Guardamos selección en cookie (simple para ahora)
    document.cookie = `active-role=${rol}; path=/`

    // Redirige al subdominio correspondiente
    window.location.href = `https://${rol}.islasounds.com`
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f0ecf1] px-4">
      <div className="bg-white shadow-md rounded-md p-6 max-w-md w-full text-center space-y-4">
        <h2 className="text-xl font-semibold text-[#0f4ccc]">Selecciona una cuenta</h2>
        <p className="text-sm text-gray-600">Tu usuario tiene acceso a varias cuentas. ¿Con cuál deseas entrar?</p>
        <div className="flex flex-col gap-3 mt-4">
          {roles.map((rol) => (
            <button
              key={rol}
              onClick={() => handleSelect(rol)}
              className="py-2 px-4 rounded bg-[#1182c7] text-white hover:bg-[#105eca] transition"
            >
              Entrar como {rol.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
