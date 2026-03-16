import React from 'react'

type VarianteBotao = 'primario' | 'secundario' | 'perigo'
type TipoBotao = 'button' | 'submit' | 'reset'

interface PropsBotao {
  children: React.ReactNode
  aoClicar?: () => void
  variante?: VarianteBotao
  desabilitado?: boolean
  carregando?: boolean
  larguraTotal?: boolean
  tipo?: TipoBotao
  className?: string
}

const estilosVariante: Record<VarianteBotao, string> = {
  primario:
    'bg-black text-white hover:bg-gray-700 focus:ring-black disabled:bg-gray-300 disabled:text-gray-500',
  secundario:
    'bg-white text-black border border-gray-300 hover:bg-gray-50 focus:ring-gray-300 disabled:bg-gray-100 disabled:text-gray-300',
  perigo:
    'bg-error text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-200 disabled:text-red-100',
}

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
)

const Button: React.FC<PropsBotao> = ({
  children,
  aoClicar,
  variante = 'primario',
  desabilitado = false,
  carregando = false,
  larguraTotal = false,
  tipo = 'button',
  className = '',
}) => {
  const estaDesabilitado = desabilitado || carregando

  return (
    <button
      type={tipo}
      onClick={aoClicar}
      disabled={estaDesabilitado}
      className={[
        'inline-flex items-center justify-center gap-2',
        'px-5 py-3 rounded-lg',
        'text-sm font-semibold',
        'transition-all duration-150 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed',
        estilosVariante[variante],
        larguraTotal ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {carregando && <Spinner />}
      {children}
    </button>
  )
}

export default Button
