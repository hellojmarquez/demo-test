'use client'

import { useState } from 'react'

export default function ConfigPage() {
  const [backupDrive, setBackupDrive] = useState(true)
  const [logSync, setLogSync] = useState(true)
  const [twoFactor, setTwoFactor] = useState(true)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#0f4ccc]">Configuraciones generales</h2>

      <div className="bg-white p-6 rounded shadow space-y-4">
        <SettingToggle
          label="Backup automático a Google Drive"
          enabled={backupDrive}
          onChange={() => setBackupDrive(!backupDrive)}
        />

        <SettingToggle
          label="Sincronizar logs diariamente"
          enabled={logSync}
          onChange={() => setLogSync(!logSync)}
        />

        <SettingToggle
          label="Forzar 2FA en todos los usuarios"
          enabled={twoFactor}
          onChange={() => setTwoFactor(!twoFactor)}
        />
      </div>
    </div>
  )
}

function SettingToggle({
  label,
  enabled,
  onChange
}: {
  label: string
  enabled: boolean
  onChange: () => void
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-800">{label}</span>
      <button
        onClick={onChange}
        className={`w-10 h-5 rounded-full transition relative ${
          enabled ? 'bg-[#1070c9]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition ${
            enabled ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  )
}
