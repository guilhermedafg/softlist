import React, { useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'

/**
 * Banner que solicita permissão de notificação — aparece uma vez.
 * Mostra apenas se a permissão ainda não foi decidida ('default').
 */
const NotificationBanner: React.FC = () => {
  const { permissao, suportado, solicitarPermissao } = useNotifications()
  const [descartado, setDescartado] = useState(false)
  const [solicitando, setSolicitando] = useState(false)

  if (!suportado || permissao !== 'default' || descartado) return null

  const handleSolicitar = async () => {
    setSolicitando(true)
    await solicitarPermissao()
    setSolicitando(false)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:right-4 sm:w-96">
      <div className="bg-black text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        {/* Ícone */}
        <div className="flex-shrink-0 w-9 h-9 bg-white/10 rounded-full flex items-center justify-center mt-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Ativar lembretes?</p>
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
            Receba notificações nos horários configurados em cada item do checklist.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleSolicitar}
              disabled={solicitando}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-bold
                         rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {solicitando ? (
                <span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
              ) : null}
              Ativar
            </button>
            <button
              onClick={() => setDescartado(true)}
              className="text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1.5"
            >
              Agora não
            </button>
          </div>
        </div>

        {/* Fechar */}
        <button
          onClick={() => setDescartado(true)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center
                     text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default NotificationBanner
