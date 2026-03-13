import React from 'react'
import type { ItemChecklist } from '../../db/schema'
import { LABEL_DIA, LABEL_RECORRENCIA } from '../../db/schema'

interface PropsItemRow {
  item: ItemChecklist
  aoEditar: () => void
  aoDeletar: () => void
}

const ItemRow: React.FC<PropsItemRow> = ({ item, aoEditar, aoDeletar }) => {
  const diasLabel = item.diasSemana.includes('todos')
    ? 'Todos os dias'
    : item.diasSemana.map((d) => LABEL_DIA[d]).join(', ')

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200
                 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      {/* Handle visual */}
      <div className="flex-shrink-0 flex flex-col gap-0.5 opacity-30">
        <div className="w-3.5 h-0.5 bg-gray-400 rounded" />
        <div className="w-3.5 h-0.5 bg-gray-400 rounded" />
        <div className="w-3.5 h-0.5 bg-gray-400 rounded" />
      </div>

      {/* Conteúdo */}
      <button
        onClick={aoEditar}
        className="flex-1 text-left min-w-0 focus:outline-none"
        aria-label={`Editar item ${item.titulo}`}
      >
        <p className="text-sm font-medium text-black truncate">{item.titulo}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
          {/* Horário */}
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
            </svg>
            {item.horario}
          </span>
          <span className="text-gray-300 text-xs">·</span>
          {/* Dias */}
          <span className="text-xs text-gray-500">{diasLabel}</span>
          <span className="text-gray-300 text-xs">·</span>
          {/* Recorrência */}
          <span className="text-xs text-gray-400">{LABEL_RECORRENCIA[item.recorrencia]}</span>
          {/* Foto obrigatória */}
          {item.requerEvidencia && (
            <>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs text-caramel flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                foto
              </span>
            </>
          )}
        </div>
      </button>

      {/* Botão deletar */}
      <button
        onClick={aoDeletar}
        aria-label={`Remover item ${item.titulo}`}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
                   text-gray-300 hover:text-error hover:bg-red-50
                   opacity-0 group-hover:opacity-100 focus:opacity-100
                   transition-all duration-150 focus:outline-none"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

export default ItemRow
