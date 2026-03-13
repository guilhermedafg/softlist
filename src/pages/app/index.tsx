import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../store/auth'
import useChecklists from '../../store/checklists'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/common/Button'
import { LABEL_DIA, diaHoje, itemEhHoje } from '../../db/schema'
import type { ItemChecklist } from '../../db/schema'

// ─── Item de Hoje ────────────────────────────────────────────────────────────

interface PropsItemHoje {
  item: ItemChecklist
  nomeChecklist: string
  aoClicar: () => void
}

const ItemHoje: React.FC<PropsItemHoje> = ({ item, nomeChecklist, aoClicar }) => (
  <button
    onClick={aoClicar}
    className="w-full text-left flex items-center gap-3 px-4 py-3 bg-white border border-gray-200
               rounded-lg hover:shadow-sm hover:border-gray-300 transition-all duration-150"
  >
    {/* Checkbox vazio (visual) */}
    <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-black transition-colors" />

    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-black truncate">{item.titulo}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-xs text-gray-400 truncate">{nomeChecklist}</span>
        {item.horario && (
          <>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-xs text-gray-500">{item.horario}</span>
          </>
        )}
        {item.requerEvidencia && (
          <>
            <span className="text-gray-300 text-xs">·</span>
            <svg className="w-3 h-3 text-caramel flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </>
        )}
      </div>
    </div>

    {/* Seta */}
    <svg className="flex-shrink-0 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </button>
)

// ─── Empty State ─────────────────────────────────────────────────────────────

const EstadoVazio: React.FC<{ aoIrParaChecklists: () => void }> = ({ aoIrParaChecklists }) => (
  <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-700">Nenhum item para hoje</p>
      <p className="text-xs text-gray-400 mt-1">
        Configure itens nos seus checklists para vê-los aqui.
      </p>
    </div>
    <Button variante="secundario" aoClicar={aoIrParaChecklists}>
      Ver meus checklists
    </Button>
  </div>
)

// ─── Página ───────────────────────────────────────────────────────────────────

const PaginaHome: React.FC = () => {
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const { checklists, itensHoje, buscarChecklists, buscarItensHoje } = useChecklists()

  useEffect(() => {
    if (!usuario?.id) return
    buscarChecklists(usuario.id)
    buscarItensHoje(usuario.id)
  }, [usuario?.id, buscarChecklists, buscarItensHoje])

  const hoje = diaHoje()

  // Filtra itens que caem hoje e os enriquece com o nome do checklist
  const itensDeHoje = useMemo(() => {
    return itensHoje
      .filter(itemEhHoje)
      .sort((a, b) => a.horario.localeCompare(b.horario))
  }, [itensHoje])

  const mapaChecklists = useMemo(() => {
    return Object.fromEntries(checklists.map((c) => [c.id, c.titulo]))
  }, [checklists])

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Usuário'
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <AppShell
      titulo="SoftList"
      semBotaoVoltar
      larguraMax="lg"
      acaoDireita={
        <Button variante="secundario" aoClicar={() => navegar('/checklists')}>
          Checklists
        </Button>
      }
    >
      {/* Saudação */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">
          Olá, <span className="text-caramel">{primeiroNome}</span>!
        </h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">{dataHoje}</p>
      </div>

      {/* Stats rápido */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-black">{checklists.length}</p>
          <p className="text-xs text-gray-500 mt-1">Checklists</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-black">{itensDeHoje.length}</p>
          <p className="text-xs text-gray-500 mt-1">Hoje</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-black">
            {checklists.filter((c) => c.ativo).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ativos</p>
        </div>
      </div>

      {/* Itens de Hoje */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-black">
            Itens de hoje
            <span className="ml-2 text-xs font-normal text-gray-400 capitalize">
              ({LABEL_DIA[hoje] ?? 'hoje'})
            </span>
          </h2>
          {itensDeHoje.length > 0 && (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {itensDeHoje.length}
            </span>
          )}
        </div>

        {itensDeHoje.length === 0 ? (
          <EstadoVazio aoIrParaChecklists={() => navegar('/checklists')} />
        ) : (
          <div className="flex flex-col gap-2">
            {itensDeHoje.map((item) => (
              <ItemHoje
                key={item.id}
                item={item}
                nomeChecklist={mapaChecklists[item.checklistId] ?? '—'}
                aoClicar={() => navegar(`/checklists/${item.checklistId}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Ação principal */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <Button variante="primario" larguraTotal aoClicar={() => navegar('/checklists')}>
          Ver todos os checklists
        </Button>
      </div>
    </AppShell>
  )
}

export default PaginaHome
