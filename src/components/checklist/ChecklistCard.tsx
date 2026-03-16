import React, { useState, useRef } from 'react'
import type { Checklist } from '../../db/schema'

interface PropsChecklistCard {
  checklist: Checklist
  totalItens: number
  aoClicar: () => void
  aoDuplicar: () => void
  aoEditar: () => void
  aoDeletar: () => void
}

const ChecklistCard: React.FC<PropsChecklistCard> = ({
  checklist,
  totalItens,
  aoClicar,
  aoDuplicar,
  aoEditar,
  aoDeletar,
}) => {
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha menu ao clicar fora
  React.useEffect(() => {
    if (!menuAberto) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuAberto])

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden
                 hover:shadow-md transition-shadow duration-150 group
                 flex border-l-4 border-l-black"
    >
      {/* Área clicável principal */}
      <button
        onClick={aoClicar}
        className="flex-1 p-4 text-left flex flex-col gap-2 focus:outline-none"
        aria-label={`Abrir checklist ${checklist.titulo}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-black leading-snug line-clamp-2">
            {checklist.titulo}
          </h3>
          {/* Status dot */}
          <span
            className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-0.5 ${
              checklist.ativo ? 'bg-success' : 'bg-gray-300'
            }`}
            title={checklist.ativo ? 'Ativo' : 'Inativo'}
          />
        </div>

        {checklist.descricao && (
          <p className="text-xs text-gray-500 line-clamp-1">{checklist.descricao}</p>
        )}

        <div className="flex items-center gap-3 mt-1">
          {/* Quantidade de itens */}
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
          </span>
          {/* Data */}
          <span className="text-xs text-gray-300">•</span>
          <span className="text-xs text-gray-400">{formatarData(checklist.criadoEm)}</span>
        </div>
      </button>

      {/* Menu "..." */}
      <div ref={menuRef} className="relative flex items-start pt-3 pr-3">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuAberto((v) => !v) }}
          aria-label="Opções"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300
                     hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>

        {menuAberto && (
          <div className="absolute right-0 top-9 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            <button
              onClick={() => { setMenuAberto(false); aoEditar() }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
            <button
              onClick={() => { setMenuAberto(false); aoDuplicar() }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicar
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={() => { setMenuAberto(false); aoDeletar() }}
              className="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-red-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Excluir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChecklistCard
