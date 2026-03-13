import React from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../store/auth'

interface PropsAppShell {
  titulo: string
  /** Se fornecido, exibe botão de voltar. Se omitido, usa navigate(-1). */
  rotaVoltar?: string
  /** Oculta completamente o botão de voltar */
  semBotaoVoltar?: boolean
  /** Elemento no canto direito do header (ex: botão de ação) */
  acaoDireita?: React.ReactNode
  children: React.ReactNode
  /** Largura máxima do conteúdo */
  larguraMax?: 'sm' | 'md' | 'lg' | 'xl'
}

const LARGURA: Record<NonNullable<PropsAppShell['larguraMax']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

const AppShell: React.FC<PropsAppShell> = ({
  titulo,
  rotaVoltar,
  semBotaoVoltar = false,
  acaoDireita,
  children,
  larguraMax = 'lg',
}) => {
  const navegar = useNavigate()
  const { logout } = useAuth()

  const handleVoltar = () => {
    if (rotaVoltar) navegar(rotaVoltar)
    else navegar(-1)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className={`${LARGURA[larguraMax]} mx-auto px-4 h-14 flex items-center justify-between gap-3`}>
          {/* Esquerda: voltar ou logo */}
          <div className="flex items-center gap-3 min-w-0">
            {!semBotaoVoltar ? (
              <button
                onClick={handleVoltar}
                aria-label="Voltar"
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
                           text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
            )}
            <h1 className="text-base font-semibold text-black truncate">{titulo}</h1>
          </div>

          {/* Direita */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {acaoDireita}
            {semBotaoVoltar && (
              <button
                onClick={() => logout()}
                aria-label="Sair"
                className="text-xs text-gray-500 hover:text-black font-medium px-2 py-1 rounded-lg
                           hover:bg-gray-100 transition-colors"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className={`${LARGURA[larguraMax]} mx-auto w-full px-4 py-6 flex-1`}>
        {children}
      </main>
    </div>
  )
}

export default AppShell
