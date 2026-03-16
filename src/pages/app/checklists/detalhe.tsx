import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useChecklists from '../../../store/checklists'
import AppShell from '../../../components/layout/AppShell'
import Button from '../../../components/common/Button'
import ItemRow from '../../../components/checklist/ItemRow'
import Modal from '../../../components/common/Modal'
import type { ItemChecklist } from '../../../db/schema'

const PaginaDetalheChecklist: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navegar = useNavigate()
  const {
    checklists, itens, estaCarregandoItens,
    buscarItens, deletarItem, deletarChecklist,
  } = useChecklists()

  const [itemParaDeletar, setItemParaDeletar] = useState<ItemChecklist | null>(null)
  const [deletandoItem, setDeletandoItem] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  const checklist = checklists.find((c) => c.id === id)
  const listaItens = (id ? itens[id] : undefined) ?? []

  useEffect(() => {
    if (id && !itens[id]) buscarItens(id)
  }, [id, itens, buscarItens])

  const handleDeletarItem = async () => {
    if (!itemParaDeletar || !id) return
    setDeletandoItem(true)
    try {
      await deletarItem(itemParaDeletar.id, id)
    } finally {
      setDeletandoItem(false)
      setItemParaDeletar(null)
    }
  }

  if (!checklist) {
    return (
      <AppShell titulo="Checklist" rotaVoltar="/checklists" larguraMax="lg">
        <div className="text-center py-20">
          <p className="text-gray-500">Checklist não encontrado.</p>
          <Button variante="secundario" aoClicar={() => navegar('/checklists')} className="mt-4">
            Voltar
          </Button>
        </div>
      </AppShell>
    )
  }

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

  return (
    <AppShell
      titulo={checklist.titulo}
      rotaVoltar="/checklists"
      larguraMax="lg"
      acaoDireita={
        <div className="flex items-center gap-2">
          <Button
            variante="secundario"
            aoClicar={() => navegar(`/checklists/${id}/editar`)}
          >
            Editar
          </Button>

          {/* Menu "..." */}
          <div className="relative">
            <button
              onClick={() => setMenuAberto((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                         text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {menuAberto && (
              <div className="absolute right-0 top-10 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => { setMenuAberto(false); navegar(`/checklists/${id}/editar`) }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Editar checklist
                </button>
                <button
                  onClick={async () => {
                    setMenuAberto(false)
                    if (!id) return
                    const { duplicarChecklist } = useChecklists.getState()
                    const copia = await duplicarChecklist(id)
                    navegar(`/checklists/${copia.id}`)
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Duplicar
                </button>
                <div className="border-t border-gray-100" />
                <button
                  onClick={async () => {
                    setMenuAberto(false)
                    if (!id) return
                    await deletarChecklist(id)
                    navegar('/checklists', { replace: true })
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-red-50"
                >
                  Excluir checklist
                </button>
              </div>
            )}
          </div>
        </div>
      }
    >
      {/* Clica fora fecha o menu */}
      {menuAberto && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
      )}

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
          checklist.ativo ? 'bg-green-50 text-success' : 'bg-gray-100 text-gray-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${checklist.ativo ? 'bg-success' : 'bg-gray-400'}`} />
          {checklist.ativo ? 'Ativo' : 'Inativo'}
        </span>

        <span className="text-xs text-gray-400">
          Criado em {formatarData(checklist.criadoEm)}
        </span>

        {checklist.descricao && (
          <p className="w-full text-sm text-gray-500">{checklist.descricao}</p>
        )}
      </div>

      {/* Seção de itens */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-black uppercase tracking-wide">
            Itens ({listaItens.length})
          </h2>
          <button
            onClick={() => navegar(`/checklists/${id}/editar`)}
            className="text-xs text-gray-500 hover:text-black font-medium flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar item
          </button>
        </div>

        {estaCarregandoItens && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!estaCarregandoItens && listaItens.length === 0 && (
          <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-400">Nenhum item cadastrado.</p>
            <button
              onClick={() => navegar(`/checklists/${id}/editar`)}
              className="mt-3 text-sm font-semibold text-black hover:underline"
            >
              + Adicionar primeiro item
            </button>
          </div>
        )}

        {!estaCarregandoItens && listaItens.length > 0 && (
          <div className="flex flex-col gap-2">
            {listaItens.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                aoEditar={() => navegar(`/checklists/${id}/editar`)}
                aoDeletar={() => setItemParaDeletar(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ações principais */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        <Button
          variante="primario"
          larguraTotal
          aoClicar={() => navegar(`/checklists/${id}/executar`)}
        >
          ▶ Executar checklist
        </Button>
        <Button
          variante="secundario"
          larguraTotal
          aoClicar={() => navegar(`/checklists/${id}/editar`)}
        >
          Editar itens
        </Button>
      </div>

      {/* Ações secundárias: histórico + galeria */}
      <div className="flex gap-3 mt-3">
        <button
          onClick={() => navegar(`/checklists/${id}/historico`)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                     border border-gray-200 rounded-lg text-sm font-medium text-gray-600
                     hover:bg-gray-50 hover:border-gray-300 hover:text-black transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Histórico
        </button>
        <button
          onClick={() => navegar(`/checklists/${id}/galeria`)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                     border border-gray-200 rounded-lg text-sm font-medium text-gray-600
                     hover:bg-gray-50 hover:border-gray-300 hover:text-black transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Galeria
        </button>
      </div>

      {/* Modal delete item */}
      <Modal
        aberto={Boolean(itemParaDeletar)}
        titulo="Remover item"
        mensagem={`Deseja remover o item "${itemParaDeletar?.titulo}"?`}
        textoBotaoConfirmar="Remover"
        varianteBotaoConfirmar="perigo"
        carregando={deletandoItem}
        aoConfirmar={handleDeletarItem}
        aoCancelar={() => setItemParaDeletar(null)}
      />
    </AppShell>
  )
}

export default PaginaDetalheChecklist
