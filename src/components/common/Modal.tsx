import React, { useEffect } from 'react'
import Button from './Button'

interface PropsModal {
  aberto: boolean
  titulo: string
  mensagem?: string
  children?: React.ReactNode
  textoBotaoConfirmar?: string
  textoBotaoCancelar?: string
  varianteBotaoConfirmar?: 'primario' | 'secundario' | 'perigo'
  carregando?: boolean
  aoConfirmar: () => void
  aoCancelar: () => void
}

const Modal: React.FC<PropsModal> = ({
  aberto,
  titulo,
  mensagem,
  children,
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  varianteBotaoConfirmar = 'primario',
  carregando = false,
  aoConfirmar,
  aoCancelar,
}) => {
  // Fecha com Escape
  useEffect(() => {
    if (!aberto) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoCancelar()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [aberto, aoCancelar])

  // Trava scroll do body
  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={aoCancelar}
        aria-hidden="true"
      />

      {/* Painel */}
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl
                      animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="p-6">
          <h2 className="text-base font-semibold text-black mb-2">{titulo}</h2>
          {mensagem && <p className="text-sm text-gray-500 mb-4">{mensagem}</p>}
          {children && <div className="mb-4">{children}</div>}
          <div className="flex gap-3 mt-4">
            <Button
              variante="secundario"
              larguraTotal
              aoClicar={aoCancelar}
              desabilitado={carregando}
            >
              {textoBotaoCancelar}
            </Button>
            <Button
              variante={varianteBotaoConfirmar}
              larguraTotal
              aoClicar={aoConfirmar}
              carregando={carregando}
              desabilitado={carregando}
            >
              {textoBotaoConfirmar}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal
