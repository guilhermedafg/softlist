import React from 'react'

interface PropsInput {
  label?: string
  placeholder?: string
  valor?: string
  aoMudar?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  tipo?: React.HTMLInputTypeAttribute
  erro?: string
  multiline?: boolean
  linhas?: number
  desabilitado?: boolean
  nome?: string
  autoComplete?: string
  className?: string
}

const Input: React.FC<PropsInput> = ({
  label,
  placeholder,
  valor,
  aoMudar,
  tipo = 'text',
  erro,
  multiline = false,
  linhas = 4,
  desabilitado = false,
  nome,
  autoComplete,
  className = '',
}) => {
  const estilosBase = [
    'w-full px-4 py-3 rounded-lg',
    'border text-sm text-gray-700',
    'placeholder:text-gray-300',
    'transition-all duration-150 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
    'disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed',
    erro ? 'border-error bg-red-50 focus:ring-error' : 'border-gray-200 bg-white',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={nome}
          className="text-xs font-semibold uppercase tracking-wide text-gray-700"
        >
          {label}
        </label>
      )}

      {multiline ? (
        <textarea
          id={nome}
          name={nome}
          value={valor}
          onChange={aoMudar}
          placeholder={placeholder}
          rows={linhas}
          disabled={desabilitado}
          className={`${estilosBase} resize-none`}
        />
      ) : (
        <input
          id={nome}
          name={nome}
          type={tipo}
          value={valor}
          onChange={aoMudar}
          placeholder={placeholder}
          disabled={desabilitado}
          autoComplete={autoComplete}
          className={estilosBase}
        />
      )}

      {erro && (
        <p className="text-xs text-error font-medium flex items-center gap-1">
          <span aria-hidden="true">!</span>
          {erro}
        </p>
      )}
    </div>
  )
}

export default Input
