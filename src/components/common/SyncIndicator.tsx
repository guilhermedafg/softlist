import React from 'react'
import { useSync, type StatusSync } from '../../hooks/useSync'

// ─── Config visual por status ─────────────────────────────────────────────────

interface ConfigStatus {
  icone: React.ReactNode
  texto: string
  classes: string
}

function configPorStatus(status: StatusSync, pendentes: number): ConfigStatus | null {
  switch (status) {
    case 'offline':
      return {
        icone: (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M3 3l18 18M9.879 9.879A3 3 0 0012 15a3 3 0 002.121-.879" />
          </svg>
        ),
        texto: pendentes > 0 ? `Offline · ${pendentes} pendente${pendentes > 1 ? 's' : ''}` : 'Offline',
        classes: 'bg-gray-800 text-gray-100',
      }

    case 'syncing':
      return {
        icone: (
          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ),
        texto: 'Sincronizando...',
        classes: 'bg-black text-white',
      }

    case 'synced':
      return {
        icone: (
          <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
        texto: 'Sincronizado',
        classes: 'bg-success/10 border border-success/30 text-success',
      }

    case 'error':
      return {
        icone: (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        ),
        texto: `Erro ao sincronizar${pendentes > 0 ? ` (${pendentes})` : ''}`,
        classes: 'bg-red-50 border border-red-200 text-error',
      }

    case 'idle':
    default:
      // Só mostra se houver pendentes em modo idle
      if (pendentes > 0) {
        return {
          icone: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          texto: `${pendentes} pendente${pendentes > 1 ? 's' : ''}`,
          classes: 'bg-caramel/10 border border-caramel/30 text-caramel',
        }
      }
      return null // idle sem pendentes → não mostra nada
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

const SyncIndicator: React.FC = () => {
  const { status, pendentes, sincronizar } = useSync()
  const config = configPorStatus(status, pendentes)

  if (!config) return null

  return (
    <button
      type="button"
      onClick={sincronizar}
      title={status === 'error' ? 'Clique para tentar novamente' : undefined}
      className={[
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
        'transition-all duration-300',
        status === 'error' ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
        config.classes,
      ].join(' ')}
    >
      {config.icone}
      <span>{config.texto}</span>
    </button>
  )
}

export default SyncIndicator
