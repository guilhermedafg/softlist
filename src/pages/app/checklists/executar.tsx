import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAuth from '../../../store/auth'
import useChecklists from '../../../store/checklists'
import useExecucoes from '../../../store/execucoes'
import ExecutionItem from '../../../components/checklist/ExecutionItem'
import Confetti from '../../../components/checklist/Confetti'
import type { StatusItem, ItemChecklist } from '../../../db/schema'

// ─── Cores da progress bar ────────────────────────────────────────────────────

const corProgressBar = (pct: number): string => {
  if (pct === 0) return '#D0D0D0'
  if (pct <= 33) return '#F44336'
  if (pct <= 66) return '#F59E0B'
  if (pct < 100) return '#8BC34A'
  return '#4CAF50'
}

// ─── Sidebar: lista de itens ──────────────────────────────────────────────────

interface PropsSidebarItem {
  item: ItemChecklist
  numero: number
  status: StatusItem | undefined
  estaAtivo: boolean
  aoClicar: () => void
}

const SidebarItem: React.FC<PropsSidebarItem> = ({ item, numero, status, estaAtivo, aoClicar }) => {
  const concluido = status === 'concluido'
  const naoAplicavel = status === 'nao_aplicavel'

  return (
    <button
      onClick={aoClicar}
      className={[
        'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'transition-all duration-150 focus:outline-none',
        estaAtivo
          ? 'bg-black text-white'
          : concluido
          ? 'bg-green-50 text-gray-600 hover:bg-green-100'
          : naoAplicavel
          ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          : 'text-gray-700 hover:bg-gray-100',
      ].join(' ')}
    >
      {/* Ícone de status */}
      <span
        className={[
          'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
          estaAtivo
            ? 'bg-white text-black'
            : concluido
            ? 'bg-success text-white'
            : naoAplicavel
            ? 'bg-gray-300 text-white'
            : 'border-2 border-gray-300 text-gray-400',
        ].join(' ')}
      >
        {concluido ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : naoAplicavel ? (
          <span>—</span>
        ) : (
          numero
        )}
      </span>

      <span
        className={[
          'flex-1 text-sm truncate',
          concluido || naoAplicavel ? 'line-through opacity-60' : 'font-medium',
        ].join(' ')}
      >
        {item.titulo}
      </span>

      {/* Horário */}
      {!estaAtivo && (
        <span className="flex-shrink-0 text-xs opacity-50">{item.horario}</span>
      )}
    </button>
  )
}

// ─── Tela de conclusão ────────────────────────────────────────────────────────

interface PropsTelaConclusao {
  nomeChecklist: string
  totalItens: number
  aoVoltar: () => void
  aoNovaExecucao: () => void
}

const TelaConclusao: React.FC<PropsTelaConclusao> = ({
  nomeChecklist,
  totalItens,
  aoVoltar,
  aoNovaExecucao,
}) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
    <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
      <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <div>
      <h2 className="text-2xl font-bold text-black">Checklist concluído!</h2>
      <p className="text-gray-500 mt-2">
        <span className="font-semibold text-black">{nomeChecklist}</span> — {totalItens} de {totalItens} itens verificados.
      </p>
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
      <button
        onClick={aoNovaExecucao}
        className="flex-1 px-5 py-3 border border-gray-200 rounded-lg text-sm font-semibold
                   text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none"
      >
        Nova execução
      </button>
      <button
        onClick={aoVoltar}
        className="flex-1 px-5 py-3 bg-black text-white rounded-lg text-sm font-semibold
                   hover:bg-gray-800 transition-colors focus:outline-none"
      >
        Voltar ao checklist
      </button>
    </div>
  </div>
)

// ─── Página principal ─────────────────────────────────────────────────────────

const PaginaExecutar: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const { checklists, itens, buscarChecklists, buscarItens } = useChecklists()
  const {
    execucaoAtiva,
    estaCarregando,
    iniciarOuRetomar,
    marcarStatus,
    atualizarNota,
    finalizar,
    limparAtiva,
  } = useExecucoes()

  const [itemAtualIdx, setItemAtualIdx] = useState(0)
  const [listaAberta, setListaAberta] = useState(false) // mobile dropdown
  const [mostrarConfetti, setMostrarConfetti] = useState(false)
  const [foiConcluido, setFoiConcluido] = useState(false)

  const checklist = checklists.find((c) => c.id === id)
  const listaItens: ItemChecklist[] = (id ? itens[id] : undefined) ?? []

  // ── Carrega dados ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !usuario?.id) return

    const carregarEIniciar = async () => {
      if (checklists.length === 0) await buscarChecklists(usuario.id)
      if (!itens[id]) await buscarItens(id)
      await iniciarOuRetomar(id, usuario.id)
    }
    carregarEIniciar()

    return () => { limparAtiva() }
  }, [id, usuario?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Calcula progresso ────────────────────────────────────────────────────

  const { totalConcluidos, porcentagem } = useMemo(() => {
    if (!execucaoAtiva || listaItens.length === 0) return { totalConcluidos: 0, _totalMarcados: 0, porcentagem: 0 }
    const respostas = execucaoAtiva.respostas
    const concluidos = Object.values(respostas).filter((r) => r.status === 'concluido').length
    const marcados = Object.values(respostas).filter((r) => r.status !== 'pendente').length
    const pct = Math.round((concluidos / listaItens.length) * 100)
    return { totalConcluidos: concluidos, _totalMarcados: marcados, porcentagem: pct }
  }, [execucaoAtiva?.respostas, listaItens.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Detecta 100% e dispara confetti ────────────────────────────────────

  useEffect(() => {
    if (porcentagem === 100 && listaItens.length > 0 && !foiConcluido) {
      setFoiConcluido(true)
      setMostrarConfetti(true)
      finalizar()
      setTimeout(() => setMostrarConfetti(false), 4000)
    }
  }, [porcentagem, listaItens.length, foiConcluido, finalizar])

  // ── Ações ────────────────────────────────────────────────────────────────

  const handleToggle = useCallback(
    (itemId: string) => {
      if (!execucaoAtiva) return
      const respostaAtual = execucaoAtiva.respostas[itemId]
      const statusAtual: StatusItem = respostaAtual?.status ?? 'pendente'

      // Ciclo: pendente → concluido → nao_aplicavel → pendente
      const proximoStatus: StatusItem =
        statusAtual === 'pendente'
          ? 'concluido'
          : statusAtual === 'concluido'
          ? 'nao_aplicavel'
          : 'pendente'

      marcarStatus(itemId, proximoStatus)
    },
    [execucaoAtiva, marcarStatus],
  )

  const irParaAnterior = () => setItemAtualIdx((i) => Math.max(0, i - 1))
  const irParaProximo  = () => setItemAtualIdx((i) => Math.min(listaItens.length - 1, i + 1))

  const handleVoltar = () => {
    navegar(`/checklists/${id}`, { replace: true })
  }

  const handleNovaExecucao = async () => {
    if (!id || !usuario?.id) return
    limparAtiva()
    setFoiConcluido(false)
    setItemAtualIdx(0)
    await iniciarOuRetomar(id, usuario.id)
  }

  // ── Tela de carregamento ─────────────────────────────────────────────────

  if (estaCarregando || !execucaoAtiva || listaItens.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {estaCarregando ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Iniciando execução...</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 mb-4">Este checklist não possui itens cadastrados.</p>
            <button onClick={handleVoltar} className="text-sm font-semibold text-black underline">
              Voltar e adicionar itens
            </button>
          </div>
        )}
      </div>
    )
  }

  const itemAtual = listaItens[itemAtualIdx]
  const pctStyle = {
    width: `${porcentagem}%`,
    backgroundColor: corProgressBar(porcentagem),
    transition: 'width 0.5s ease, background-color 0.5s ease',
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Linha 1: navegação + título + contador */}
          <div className="h-14 flex items-center gap-3">
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

            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                Executando
              </p>
              <h1 className="text-sm font-bold text-black truncate">
                {checklist?.titulo ?? 'Carregando...'}
              </h1>
            </div>

            {/* Contador */}
            <div className="flex-shrink-0 text-right">
              <p className="text-lg font-bold text-black tabular-nums">
                {totalConcluidos}
                <span className="text-gray-300 font-normal">/{listaItens.length}</span>
              </p>
              <p className="text-xs text-gray-400 -mt-1">{porcentagem}%</p>
            </div>
          </div>

          {/* Linha 2: progress bar */}
          <div className="pb-3">
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full" style={pctStyle} />
            </div>
            {/* Labels min/max */}
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">0%</span>
              <span
                className="text-xs font-semibold transition-colors duration-500"
                style={{ color: corProgressBar(porcentagem) }}
              >
                {porcentagem > 0 ? `${porcentagem}% concluído` : 'Nenhum item marcado'}
              </span>
              <span className="text-xs text-gray-400">100%</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Corpo ── */}
      {foiConcluido ? (
        /* Tela de 100% */
        <div className="flex-1 max-w-6xl mx-auto w-full px-4">
          <TelaConclusao
            nomeChecklist={checklist?.titulo ?? ''}
            totalItens={listaItens.length}
            aoVoltar={handleVoltar}
            aoNovaExecucao={handleNovaExecucao}
          />
        </div>
      ) : (
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          <div className="flex gap-6 h-full">

            {/* ── Sidebar (desktop/tablet) ── */}
            <aside className="hidden md:flex flex-col w-64 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-[117px]">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Itens ({listaItens.length})
                  </p>
                </div>
                <div className="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {listaItens.map((item, idx) => (
                    <SidebarItem
                      key={item.id}
                      item={item}
                      numero={idx + 1}
                      status={execucaoAtiva.respostas[item.id]?.status}
                      estaAtivo={idx === itemAtualIdx}
                      aoClicar={() => setItemAtualIdx(idx)}
                    />
                  ))}
                </div>

                {/* Mini progress na sidebar */}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Progresso</span>
                    <span className="text-xs font-bold" style={{ color: corProgressBar(porcentagem) }}>
                      {porcentagem}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={pctStyle} />
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Conteúdo principal ── */}
            <main className="flex-1 min-w-0 flex flex-col gap-4">

              {/* Item atual */}
              <ExecutionItem
                key={itemAtual.id}
                item={itemAtual}
                resposta={execucaoAtiva.respostas[itemAtual.id]}
                numero={itemAtualIdx + 1}
                estaAtivo
                aoToggle={() => handleToggle(itemAtual.id)}
                aoAtualizarNota={(nota) => atualizarNota(itemAtual.id, nota)}
              />

              {/* Navegação */}
              <div className="flex items-center gap-3">
                {/* Anterior */}
                <button
                  onClick={irParaAnterior}
                  disabled={itemAtualIdx === 0}
                  className={[
                    'flex items-center gap-2 px-5 h-12 rounded-xl font-semibold text-sm',
                    'transition-all duration-150 focus:outline-none',
                    itemAtualIdx === 0
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-black hover:text-black active:scale-95',
                  ].join(' ')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>

                {/* Dots de paginação */}
                <div className="flex-1 flex items-center justify-center gap-1.5">
                  {listaItens.map((item, idx) => {
                    const status = execucaoAtiva.respostas[item.id]?.status
                    const concluido = status === 'concluido'
                    return (
                      <button
                        key={item.id}
                        onClick={() => setItemAtualIdx(idx)}
                        title={`Item ${idx + 1}: ${item.titulo}`}
                        className="focus:outline-none"
                      >
                        <span
                          className={[
                            'block rounded-full transition-all duration-200',
                            idx === itemAtualIdx
                              ? 'w-6 h-2.5 bg-black'
                              : concluido
                              ? 'w-2.5 h-2.5 bg-success'
                              : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400',
                          ].join(' ')}
                        />
                      </button>
                    )
                  })}
                </div>

                {/* Próximo */}
                <button
                  onClick={irParaProximo}
                  disabled={itemAtualIdx === listaItens.length - 1}
                  className={[
                    'flex items-center gap-2 px-5 h-12 rounded-xl font-semibold text-sm',
                    'transition-all duration-150 focus:outline-none',
                    itemAtualIdx === listaItens.length - 1
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800 active:scale-95',
                  ].join(' ')}
                >
                  Próximo
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Mobile: dropdown de todos os itens */}
              <div className="md:hidden">
                <button
                  onClick={() => setListaAberta((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border
                             border-gray-200 rounded-xl text-sm font-medium text-gray-700
                             hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  <span>
                    Ver todos os itens ({totalConcluidos}/{listaItens.length} concluídos)
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${listaAberta ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {listaAberta && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-xl p-2 animate-slide-up">
                    {listaItens.map((item, idx) => (
                      <SidebarItem
                        key={item.id}
                        item={item}
                        numero={idx + 1}
                        status={execucaoAtiva.respostas[item.id]?.status}
                        estaAtivo={idx === itemAtualIdx}
                        aoClicar={() => { setItemAtualIdx(idx); setListaAberta(false) }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Dica de ciclo */}
              <p className="text-xs text-gray-400 text-center">
                Clique no círculo para alternar: pendente → concluído → N/A
              </p>
            </main>
          </div>
        </div>
      )}

      {/* Confetti */}
      <Confetti ativo={mostrarConfetti} />
    </div>
  )
}

export default PaginaExecutar
