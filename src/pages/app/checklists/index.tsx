import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../../store/auth'
import useChecklists from '../../../store/checklists'
import AppShell from '../../../components/layout/AppShell'
import Button from '../../../components/common/Button'
import ChecklistCard from '../../../components/checklist/ChecklistCard'
import Modal from '../../../components/common/Modal'
import type { Checklist } from '../../../db/schema'

// ─── Empty State ─────────────────────────────────────────────────────────────

const EstadoVazio: React.FC<{ aoCriar: () => void }> = ({ aoCriar }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
      <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
    <div>
      <p className="text-base font-semibold text-black">Nenhum checklist ainda</p>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">
        Crie seu primeiro checklist para começar a organizar suas verificações.
      </p>
    </div>
    <Button variante="primario" aoClicar={aoCriar}>
      + Criar primeiro checklist
    </Button>
  </div>
)

// ─── Página ───────────────────────────────────────────────────────────────────

type FiltroStatus = 'todos' | 'ativo' | 'inativo'

const PaginaListaChecklists: React.FC = () => {
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const {
    checklists, itens, estaCarregando,
    buscarChecklists, buscarItens, deletarChecklist, duplicarChecklist,
  } = useChecklists()

  const [filtro, setFiltro] = useState<FiltroStatus>('todos')
  const [checklistParaDeletar, setChecklistParaDeletar] = useState<Checklist | null>(null)
  const [deletando, setDeletando] = useState(false)
  const [duplicando, setDuplicando] = useState<string | null>(null)

  useEffect(() => {
    if (!usuario?.id) return
    buscarChecklists(usuario.id)
  }, [usuario?.id, buscarChecklists])

  // Busca contagem de itens de todos os checklists
  useEffect(() => {
    checklists.forEach((c) => {
      if (!itens[c.id]) buscarItens(c.id)
    })
  }, [checklists, itens, buscarItens])

  const checklistsFiltrados = checklists.filter((c) => {
    if (filtro === 'ativo') return c.ativo
    if (filtro === 'inativo') return !c.ativo
    return true
  })

  const handleDeletar = async () => {
    if (!checklistParaDeletar) return
    setDeletando(true)
    try {
      await deletarChecklist(checklistParaDeletar.id)
    } finally {
      setDeletando(false)
      setChecklistParaDeletar(null)
    }
  }

  const handleDuplicar = async (id: string) => {
    setDuplicando(id)
    try {
      await duplicarChecklist(id)
    } finally {
      setDuplicando(null)
    }
  }

  return (
    <AppShell
      titulo="Meus Checklists"
      rotaVoltar="/"
      larguraMax="lg"
    >
      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(['todos', 'ativo', 'inativo'] as FiltroStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={[
              'px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all',
              'border focus:outline-none',
              filtro === f
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400',
            ].join(' ')}
          >
            {f === 'todos' ? 'Todos' : f === 'ativo' ? 'Ativos' : 'Inativos'}
          </button>
        ))}

        <span className="ml-auto text-xs text-gray-400 self-center">
          {checklistsFiltrados.length} resultado{checklistsFiltrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading */}
      {estaCarregando && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Lista */}
      {!estaCarregando && checklistsFiltrados.length === 0 && (
        <EstadoVazio aoCriar={() => navegar('/checklists/criar')} />
      )}

      {!estaCarregando && checklistsFiltrados.length > 0 && (
        <div className="flex flex-col gap-3">
          {checklistsFiltrados.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              totalItens={itens[checklist.id]?.length ?? 0}
              aoClicar={() => navegar(`/checklists/${checklist.id}`)}
              aoEditar={() => navegar(`/checklists/${checklist.id}/editar`)}
              aoDuplicar={() => handleDuplicar(checklist.id)}
              aoDeletar={() => setChecklistParaDeletar(checklist)}
            />
          ))}
        </div>
      )}

      {/* FAB — Novo Checklist */}
      <div className="fixed bottom-6 right-6 z-10 sm:static sm:mt-10 sm:flex sm:justify-end">
        <button
          onClick={() => navegar('/checklists/criar')}
          className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-full
                     shadow-lg hover:bg-gray-800 active:scale-95 transition-all
                     text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo checklist
        </button>
      </div>

      {/* Modal de confirmação de delete */}
      <Modal
        aberto={Boolean(checklistParaDeletar)}
        titulo="Excluir checklist"
        mensagem={`Tem certeza que deseja excluir "${checklistParaDeletar?.titulo}"? Esta ação não pode ser desfeita e todos os itens serão removidos.`}
        textoBotaoConfirmar="Excluir"
        varianteBotaoConfirmar="perigo"
        carregando={deletando}
        aoConfirmar={handleDeletar}
        aoCancelar={() => setChecklistParaDeletar(null)}
      />

      {/* Overlay de duplicando */}
      {duplicando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3 shadow-xl">
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-black">Duplicando checklist...</span>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default PaginaListaChecklists
