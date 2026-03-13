import React from 'react'
import type { TipoRecorrencia } from '../../db/schema'
import { LABEL_RECORRENCIA } from '../../db/schema'

const OPCOES: TipoRecorrencia[] = ['nenhuma', 'diaria', 'dias_uteis', 'semanal', 'mensal', 'anual']

interface PropsRecurrenceSelector {
  valor: TipoRecorrencia
  aoMudar: (valor: TipoRecorrencia) => void
  erro?: string
  label?: string
}

const RecurrenceSelector: React.FC<PropsRecurrenceSelector> = ({
  valor,
  aoMudar,
  erro,
  label = 'Recorrência',
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-700">
        {label}
      </label>

      <div className="relative">
        <select
          value={valor}
          onChange={(e) => aoMudar(e.target.value as TipoRecorrencia)}
          className={[
            'w-full appearance-none px-4 py-3 rounded-lg border text-sm text-gray-700',
            'bg-white pr-10',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
            erro ? 'border-error' : 'border-gray-200',
          ].join(' ')}
        >
          {OPCOES.map((op) => (
            <option key={op} value={op}>
              {LABEL_RECORRENCIA[op]}
            </option>
          ))}
        </select>

        {/* Ícone de seta */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {erro && <p className="text-xs text-error font-medium">! {erro}</p>}
    </div>
  )
}

export default RecurrenceSelector
