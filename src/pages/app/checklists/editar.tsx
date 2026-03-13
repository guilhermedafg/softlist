import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useChecklists from '../../../store/checklists'
import AppShell from '../../../components/layout/AppShell'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import ItemRow from '../../../components/checklist/ItemRow'
import DayOfWeekSelector from '../../../components/checklist/DayOfWeekSelector'
import RecurrenceSelector from '../../../components/checklist/RecurrenceSelector'
import Modal from '../../../components/common/Modal'
import type { DiaSemana, TipoRecorrencia, ItemChecklist } from '../../../db/schema'

// ─── Form de item ─────────────────────────────────────────────────────────────

interface DadosFormItem {
  titulo: string
  diasSemana: DiaSemana[]
  horario: string
  recorrencia: TipoRecorrencia
  requerEvidencia: boolean
  descricao: string
}

const FORM_ITEM_INICIAL: DadosFormItem = {
  titulo: '',
  diasSemana: ['todos'],
  horario: '08:00',
  recorrencia: 'diaria',
  requerEvidencia: false,
  descricao: '',
}

interface ErrosFormItem {
  titulo?: string
  diasSemana?: string
  horario?: string
}

const validarItem = (dados: DadosFormItem): ErrosFormItem => {
  const erros: ErrosFormItem = {}
  if (!dados.titulo.trim()) erros.titulo = 'O título é obrigatório.'
  else if (dados.titulo.trim().length < 2) erros.titulo = 'Mínimo 2 caracteres.'
  else if (dados.titulo.trim().length > 120) erros.titulo = 'Máximo 120 caracteres.'
  if (dados.diasSemana.length === 0) erros.diasSemana = 'Selecione ao menos um dia.'
  if (!dados.horario) erros.horario = 'Informe o horário.'
  return erros
}

// ─── Form de edição do checklist ──────────────────────────────────────────────

interface DadosFormChecklist {
  titulo: string
  descricao: string
}

// ─── Página ───────────────────────────────────────────────────────────────────

const PaginaEditarChecklist: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navegar = useNavigate()
  const {
    checklists, itens, estaCarregandoItens,
    buscarItens, atualizarChecklist, criarItem, atualizarItem, deletarItem,
  } = useChecklists()

  const checklist = checklists.find((c) => c.id === id)
  const listaItens = (id ? itens[id] : undefined) ?? []

  // Form do checklist
  const [formChecklist, setFormChecklist] = useState<DadosFormChecklist>({
    titulo: checklist?.titulo ?? '',
    descricao: checklist?.descricao ?? '',
  })
  const [errosChecklist, setErrosChecklist] = useState<{ titulo?: string }>({})
  const [salvandoChecklist, setSalvandoChecklist] = useState(false)
  const [checklistSalvo, setChecklistSalvo] = useState(false)

  // Form de item
  const [formItem, setFormItem] = useState<DadosFormItem>(FORM_ITEM_INICIAL)
  const [errosItem, setErrosItem] = useState<ErrosFormItem>({})
  const [itemEditandoId, setItemEditandoId] = useState<string | null>(null)
  const [adicionandoItem, setAdicionandoItem] = useState(false)

  // Modal de delete
  const [itemParaDeletar, setItemParaDeletar] = useState<ItemChecklist | null>(null)
  const [deletandoItem, setDeletandoItem] = useState(false)

  // Sincroniza form com dados do checklist quando chegarem
  useEffect(() => {
    if (checklist) {
      setFormChecklist({ titulo: checklist.titulo, descricao: checklist.descricao ?? '' })
    }
  }, [checklist?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (id && !itens[id]) buscarItens(id)
  }, [id, itens, buscarItens])

  // ── Checklist ─────────────────────────────────────────────────────────────

  const handleSalvarChecklist = async (e: React.FormEvent) => {
    e.preventDefault()
    const novosErros: { titulo?: string } = {}
    if (!formChecklist.titulo.trim()) novosErros.titulo = 'O título é obrigatório.'
    else if (formChecklist.titulo.trim().length < 3) novosErros.titulo = 'Mínimo 3 caracteres.'
    setErrosChecklist(novosErros)
    if (Object.keys(novosErros).length > 0 || !id) return

    setSalvandoChecklist(true)
    try {
      await atualizarChecklist(id, {
        titulo: formChecklist.titulo.trim(),
        descricao: formChecklist.descricao.trim() || undefined,
      })
      setChecklistSalvo(true)
      setTimeout(() => setChecklistSalvo(false), 2000)
    } finally {
      setSalvandoChecklist(false)
    }
  }

  // ── Itens ─────────────────────────────────────────────────────────────────

  const abrirEdicaoItem = (item: ItemChecklist) => {
    setItemEditandoId(item.id)
    setFormItem({
      titulo: item.titulo,
      diasSemana: item.diasSemana,
      horario: item.horario,
      recorrencia: item.recorrencia,
      requerEvidencia: item.requerEvidencia,
      descricao: item.descricao ?? '',
    })
    setErrosItem({})
    // Scroll suave até o form
    setTimeout(() => {
      document.getElementById('form-item')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const cancelarEdicaoItem = () => {
    setItemEditandoId(null)
    setFormItem(FORM_ITEM_INICIAL)
    setErrosItem({})
  }

  const handleSalvarItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const erros = validarItem(formItem)
    setErrosItem(erros)
    if (Object.keys(erros).length > 0 || !id) return

    setAdicionandoItem(true)
    try {
      if (itemEditandoId) {
        await atualizarItem(itemEditandoId, id, {
          titulo: formItem.titulo.trim(),
          diasSemana: formItem.diasSemana,
          horario: formItem.horario,
          recorrencia: formItem.recorrencia,
          requerEvidencia: formItem.requerEvidencia,
          descricao: formItem.descricao.trim() || undefined,
        })
        setItemEditandoId(null)
      } else {
        await criarItem({
          checklistId: id,
          titulo: formItem.titulo.trim(),
          diasSemana: formItem.diasSemana,
          horario: formItem.horario,
          recorrencia: formItem.recorrencia,
          requerEvidencia: formItem.requerEvidencia,
          descricao: formItem.descricao.trim() || undefined,
          obrigatorio: false,
          ordem: listaItens.length,
        })
      }
      setFormItem(FORM_ITEM_INICIAL)
      setErrosItem({})
    } finally {
      setAdicionandoItem(false)
    }
  }

  const handleDeletarItem = async () => {
    if (!itemParaDeletar || !id) return
    setDeletandoItem(true)
    try {
      await deletarItem(itemParaDeletar.id, id)
      if (itemEditandoId === itemParaDeletar.id) cancelarEdicaoItem()
    } finally {
      setDeletandoItem(false)
      setItemParaDeletar(null)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (!checklist) {
    return (
      <AppShell titulo="Editar Checklist" rotaVoltar="/checklists" larguraMax="lg">
        <div className="text-center py-20">
          <p className="text-gray-500">Checklist não encontrado.</p>
          <Button variante="secundario" aoClicar={() => navegar('/checklists')} className="mt-4">
            Voltar
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      titulo="Editar Checklist"
      rotaVoltar={`/checklists/${id}`}
      larguraMax="lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Coluna esquerda: info + itens ── */}
        <div className="flex flex-col gap-6">

          {/* Seção: Dados do checklist */}
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-black uppercase tracking-wide mb-4">
              Dados do checklist
            </h2>
            <form onSubmit={handleSalvarChecklist} className="flex flex-col gap-4">
              <Input
                nome="titulo-checklist"
                label="Título *"
                valor={formChecklist.titulo}
                aoMudar={(e) => setFormChecklist((s) => ({ ...s, titulo: e.target.value }))}
                erro={errosChecklist.titulo}
                placeholder="Nome do checklist"
              />
              <Input
                nome="descricao-checklist"
                label="Descrição (opcional)"
                valor={formChecklist.descricao}
                aoMudar={(e) => setFormChecklist((s) => ({ ...s, descricao: e.target.value }))}
                multiline
                linhas={2}
                placeholder="Descreva o objetivo deste checklist..."
              />

              <div className="flex items-center gap-3">
                <Button
                  tipo="submit"
                  variante="primario"
                  carregando={salvandoChecklist}
                  desabilitado={salvandoChecklist}
                >
                  {checklistSalvo ? '✓ Salvo!' : 'Salvar alterações'}
                </Button>
                <Button
                  variante="secundario"
                  aoClicar={() => navegar(`/checklists/${id}`)}
                  desabilitado={salvandoChecklist}
                >
                  Ver checklist
                </Button>
              </div>
            </form>
          </section>

          {/* Seção: Lista de itens */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-black uppercase tracking-wide">
                Itens ({listaItens.length})
              </h2>
            </div>

            {estaCarregandoItens && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!estaCarregandoItens && listaItens.length === 0 && (
              <div className="text-center py-8 bg-white border border-dashed border-gray-200 rounded-lg">
                <p className="text-sm text-gray-400">Nenhum item. Adicione pelo formulário →</p>
              </div>
            )}

            {!estaCarregandoItens && listaItens.length > 0 && (
              <div className="flex flex-col gap-2">
                {listaItens.map((item) => (
                  <div
                    key={item.id}
                    className={itemEditandoId === item.id ? 'ring-2 ring-black rounded-lg' : ''}
                  >
                    <ItemRow
                      item={item}
                      aoEditar={() =>
                        itemEditandoId === item.id ? cancelarEdicaoItem() : abrirEdicaoItem(item)
                      }
                      aoDeletar={() => setItemParaDeletar(item)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Coluna direita: form de item ── */}
        <div>
          <section
            id="form-item"
            className="bg-white border border-gray-200 rounded-xl p-5 sticky top-20"
          >
            <h2 className="text-sm font-semibold text-black uppercase tracking-wide mb-4">
              {itemEditandoId ? 'Editar item' : 'Adicionar item'}
            </h2>

            <form onSubmit={handleSalvarItem} noValidate className="flex flex-col gap-4">
              {/* Título */}
              <Input
                nome="titulo-item"
                label="Título do item *"
                placeholder="Ex: Verificar temperatura do forno"
                valor={formItem.titulo}
                aoMudar={(e) => setFormItem((s) => ({ ...s, titulo: e.target.value }))}
                erro={errosItem.titulo}
                autoComplete="off"
              />

              {/* Dias da semana */}
              <DayOfWeekSelector
                valor={formItem.diasSemana}
                aoMudar={(dias) => setFormItem((s) => ({ ...s, diasSemana: dias }))}
                erro={errosItem.diasSemana}
              />

              {/* Horário */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="horario-item"
                  className="text-xs font-semibold uppercase tracking-wide text-gray-700"
                >
                  Horário *
                </label>
                <input
                  id="horario-item"
                  type="time"
                  value={formItem.horario}
                  onChange={(e) => setFormItem((s) => ({ ...s, horario: e.target.value }))}
                  className={[
                    'w-full px-4 py-3 rounded-lg border text-sm text-gray-700',
                    'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
                    'transition-all duration-150',
                    errosItem.horario ? 'border-error bg-red-50' : 'border-gray-200 bg-white',
                  ].join(' ')}
                />
                {errosItem.horario && (
                  <p className="text-xs text-error font-medium">! {errosItem.horario}</p>
                )}
              </div>

              {/* Recorrência */}
              <RecurrenceSelector
                valor={formItem.recorrencia}
                aoMudar={(v) => setFormItem((s) => ({ ...s, recorrencia: v }))}
              />

              {/* Descrição opcional */}
              <Input
                nome="descricao-item"
                label="Instrução (opcional)"
                placeholder="Como executar este item..."
                valor={formItem.descricao}
                aoMudar={(e) => setFormItem((s) => ({ ...s, descricao: e.target.value }))}
                multiline
                linhas={2}
              />

              {/* Toggle foto obrigatória */}
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-black">Foto obrigatória</p>
                  <p className="text-xs text-gray-500">Exige evidência fotográfica</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formItem.requerEvidencia}
                  onClick={() =>
                    setFormItem((s) => ({ ...s, requerEvidencia: !s.requerEvidencia }))
                  }
                  className={[
                    'relative inline-flex h-6 w-11 items-center rounded-full',
                    'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2',
                    formItem.requerEvidencia ? 'bg-black' : 'bg-gray-200',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow',
                      'transition-transform duration-200',
                      formItem.requerEvidencia ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')}
                  />
                </button>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-1">
                {itemEditandoId && (
                  <Button
                    variante="secundario"
                    aoClicar={cancelarEdicaoItem}
                    desabilitado={adicionandoItem}
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  tipo="submit"
                  variante="primario"
                  larguraTotal
                  carregando={adicionandoItem}
                  desabilitado={adicionandoItem}
                >
                  {adicionandoItem
                    ? itemEditandoId
                      ? 'Salvando...'
                      : 'Adicionando...'
                    : itemEditandoId
                    ? 'Salvar item'
                    : '+ Adicionar item'}
                </Button>
              </div>
            </form>
          </section>
        </div>
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

export default PaginaEditarChecklist
