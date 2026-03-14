import React, { useState, useMemo } from 'react'
import type { ExecucaoLocal } from '../../api/execucoes-endpoints'
import type { ItemChecklist } from '../../db/schema'
import type { FotoArmazenada } from '../../db/storage'
import type { FotoComMeta } from '../gallery/PhotoLightbox'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FiltroHistorico = '7d' | '30d' | 'tudo'

interface GrupoData {
  chave: string       // YYYY-MM-DD
  label: string       // '13 de março de 2026'
  execucoes: ExecucaoLocal[]
}

interface PropsHistoryTimeline {
  execucoes: ExecucaoLocal[]
  itens: ItemChecklist[]
  fotosPorExecucao: Record<string, FotoArmazenada[]>
  filtro: FiltroHistorico
  aoMudarFiltro: (f: FiltroHistorico) => void
  aoAbrirFoto: (fotos: FotoComMeta[], indice: number) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FILTROS: { valor: FiltroHistorico; label: string }[] = [
  { valor: '7d', label: 'Últimos 7 dias' },
  { valor: '30d', label: 'Últimos 30 dias' },
  { valor: 'tudo', label: 'Tudo' },
]

function filtrarExecucoes(
  execucoes: ExecucaoLocal[],
  filtro: FiltroHistorico,
): ExecucaoLocal[] {
  if (filtro === 'tudo') return execucoes
  const limiteMs = filtro === '7d' ? 7 * 86_400_000 : 30 * 86_400_000
  const corte = Date.now() - limiteMs
  return execucoes.filter((e) => new Date(e.iniciadaEm).getTime() >= corte)
}

function agruparPorData(execucoes: ExecucaoLocal[]): GrupoData[] {
  const mapa = new Map<string, ExecucaoLocal[]>()
  for (const exec of execucoes) {
    const chave = exec.iniciadaEm.split('T')[0]
    if (!mapa.has(chave)) mapa.set(chave, [])
    mapa.get(chave)!.push(exec)
  }
  return Array.from(mapa.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([chave, execs]) => ({
      chave,
      label: new Date(`${chave}T12:00:00`).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      execucoes: execs.sort((a, b) => b.iniciadaEm.localeCompare(a.iniciadaEm)),
    }))
}

const formatarHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const corDot = (concluidos: number, total: number): string => {
  if (total === 0) return 'bg-gray-300'
  const pct = concluidos / total
  if (pct === 1) return 'bg-success'
  if (pct >= 0.5) return 'bg-caramel'
  return 'bg-error/70'
}

// ─── Card de uma execução ─────────────────────────────────────────────────────

interface PropsExecucaoCard {
  exec: ExecucaoLocal
  itens: ItemChecklist[]
  fotos: FotoArmazenada[]
  aoAbrirFoto: (fotos: FotoComMeta[], indice: number) => void
}

const ExecucaoCard: React.FC<PropsExecucaoCard> = ({ exec, itens, fotos, aoAbrirFoto }) => {
  const [expandido, setExpandido] = useState(false)

  const concluidos = itens.filter((it) => exec.respostas[it.id]?.status === 'concluido').length
  const naoAplicaveis = itens.filter((it) => exec.respostas[it.id]?.status === 'nao_aplicavel').length
  const faltantes = itens.length - concluidos - naoAplicaveis
  const pct = itens.length > 0 ? Math.round((concluidos / itens.length) * 100) : 0

  const corStatus =
    pct === 100 ? 'text-success' : pct >= 50 ? 'text-caramel' : 'text-error'

  const corBorda =
    pct === 100
      ? 'border-success/20'
      : pct >= 50
      ? 'border-caramel/20'
      : 'border-gray-200'

  // Monta FotoComMeta para o lightbox
  const fotosComMeta: FotoComMeta[] = fotos.map((f) => ({
    id: f.id,
    dataUrl: f.dataUrl,
    tamanhoBytes: f.tamanhoBytes,
    capturadaEm: f.capturadaEm,
    itemId: f.itemId,
    itemTitulo: itens.find((it) => it.id === f.itemId)?.titulo ?? 'Item desconhecido',
    execucaoId: exec.id,
    executadaEm: exec.iniciadaEm,
  }))

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${corBorda} bg-white`}>
      {/* Header do card */}
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Hora */}
        <span className="text-xs text-gray-400 tabular-nums w-10 flex-shrink-0">
          {formatarHora(exec.iniciadaEm)}
        </span>

        {/* Estatísticas */}
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <span className={`text-sm font-bold tabular-nums ${corStatus}`}>
            {pct}%
          </span>
          <span className="text-xs text-gray-500">
            {concluidos}/{itens.length} concluídos
          </span>
          {faltantes > 0 && (
            <span className="text-xs text-error font-medium">
              {faltantes} faltante{faltantes > 1 ? 's' : ''}
            </span>
          )}
          {naoAplicaveis > 0 && (
            <span className="text-xs text-gray-400">{naoAplicaveis} N/A</span>
          )}
          {fotos.length > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {fotos.length} foto{fotos.length > 1 ? 's' : ''}
            </span>
          )}
          {exec.status === 'concluida' && (
            <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded-full font-medium">
              ✓ Concluída
            </span>
          )}
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mini progress bar */}
      <div className="h-0.5 bg-gray-100 mx-4">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? '#4CAF50' : pct >= 50 ? '#D4A574' : '#F44336',
          }}
        />
      </div>

      {/* Conteúdo expandido */}
      {expandido && (
        <div className="border-t border-gray-100">
          {/* Fotos no topo (se houver) */}
          {fotosComMeta.length > 0 && (
            <div className="px-4 pt-3 pb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Fotos ({fotosComMeta.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {fotosComMeta.map((foto, i) => (
                  <button
                    key={foto.id}
                    type="button"
                    onClick={() => aoAbrirFoto(fotosComMeta, i)}
                    className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-100
                               hover:border-black transition-colors focus:outline-none"
                  >
                    <img
                      src={foto.dataUrl}
                      alt={foto.itemTitulo}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de itens */}
          <div className="divide-y divide-gray-50">
            {itens.map((item) => {
              const resposta = exec.respostas[item.id]
              const status = resposta?.status ?? 'pendente'
              const fotosItem = fotosComMeta.filter((f) => f.itemId === item.id)

              return (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    {/* Status dot */}
                    <span
                      className={[
                        'flex-shrink-0 w-3 h-3 rounded-full mt-1',
                        status === 'concluido'
                          ? 'bg-success'
                          : status === 'nao_aplicavel'
                          ? 'bg-gray-300'
                          : 'bg-gray-200',
                      ].join(' ')}
                    />

                    <div className="flex-1 min-w-0">
                      <p
                        className={[
                          'text-sm font-medium',
                          status === 'concluido'
                            ? 'line-through text-gray-400'
                            : status === 'nao_aplicavel'
                            ? 'line-through text-gray-400'
                            : 'text-gray-700',
                        ].join(' ')}
                      >
                        {item.titulo}
                      </p>

                      {/* Nota */}
                      {resposta?.observacao && (
                        <p className="text-xs text-gray-400 mt-1 italic leading-relaxed">
                          "{resposta.observacao}"
                        </p>
                      )}

                      {/* Thumbs do item */}
                      {fotosItem.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {fotosItem.map((foto) => (
                            <button
                              key={foto.id}
                              type="button"
                              onClick={() => aoAbrirFoto(fotosComMeta, fotosComMeta.indexOf(foto))}
                              className="w-10 h-10 rounded overflow-hidden border border-gray-200
                                         hover:border-black transition-colors"
                            >
                              <img src={foto.dataUrl} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Badge status */}
                    <span
                      className={[
                        'flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium',
                        status === 'concluido'
                          ? 'bg-success/10 text-success'
                          : status === 'nao_aplicavel'
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-gray-50 text-gray-400',
                      ].join(' ')}
                    >
                      {status === 'concluido' ? '✓' : status === 'nao_aplicavel' ? 'N/A' : '○'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const HistoryTimeline: React.FC<PropsHistoryTimeline> = ({
  execucoes,
  itens,
  fotosPorExecucao,
  filtro,
  aoMudarFiltro,
  aoAbrirFoto,
}) => {
  const grupos = useMemo(
    () => agruparPorData(filtrarExecucoes(execucoes, filtro)),
    [execucoes, filtro],
  )

  if (execucoes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-400 font-medium">Nenhuma execução registrada.</p>
        <p className="text-gray-300 text-sm mt-1">Execute o checklist para ver o histórico aqui.</p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Filtros ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTROS.map(({ valor, label }) => (
          <button
            key={valor}
            type="button"
            onClick={() => aoMudarFiltro(valor)}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150',
              filtro === valor
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700',
            ].join(' ')}
          >
            {label}
          </button>
        ))}

        {/* Resumo */}
        <span className="ml-auto text-xs text-gray-400">
          {grupos.reduce((acc, g) => acc + g.execucoes.length, 0)} execuç{grupos.reduce((a, g) => a + g.execucoes.length, 0) === 1 ? 'ão' : 'ões'}
          {' '}em {grupos.length} dia{grupos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {grupos.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          Nenhuma execução no período selecionado.
        </div>
      )}

      {/* ── Timeline ── */}
      <div className="relative">
        {/* Linha vertical */}
        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" aria-hidden />

        <div className="space-y-8">
          {grupos.map((grupo, gi) => {
            const totalExecucoes = grupo.execucoes.length
            const totalConcluidas = grupo.execucoes.filter((e) => e.status === 'concluida').length
            const totalConcluidosItens = grupo.execucoes.reduce(
              (acc, exec) =>
                acc + itens.filter((it) => exec.respostas[it.id]?.status === 'concluido').length,
              0,
            )
            const maxPossivel = totalExecucoes * itens.length
            const pctGrupo = maxPossivel > 0 ? Math.round((totalConcluidosItens / maxPossivel) * 100) : 0

            return (
              <div key={grupo.chave} className="relative pl-10">
                {/* Dot do dia */}
                <div
                  className={[
                    'absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center',
                    'border-2 border-white shadow-sm z-10',
                    corDot(totalConcluidas, totalExecucoes) === 'bg-success'
                      ? 'bg-success'
                      : corDot(totalConcluidas, totalExecucoes) === 'bg-caramel'
                      ? 'bg-caramel'
                      : 'bg-gray-300',
                  ].join(' ')}
                >
                  {totalConcluidas === totalExecucoes && totalExecucoes > 0 ? (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-white text-xs font-bold">{totalExecucoes}</span>
                  )}
                </div>

                {/* Data label */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-bold text-black capitalize">{grupo.label}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {totalConcluidosItens}/{maxPossivel} itens
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: pctGrupo === 100 ? '#4CAF50' : pctGrupo >= 50 ? '#D4A574' : '#F44336',
                      }}
                    >
                      {pctGrupo}%
                    </span>
                  </div>
                  {gi === 0 && (
                    <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">
                      Mais recente
                    </span>
                  )}
                </div>

                {/* Cards de execuções do dia */}
                <div className="space-y-2">
                  {grupo.execucoes.map((exec) => (
                    <ExecucaoCard
                      key={exec.id}
                      exec={exec}
                      itens={itens}
                      fotos={fotosPorExecucao[exec.id] ?? []}
                      aoAbrirFoto={aoAbrirFoto}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default HistoryTimeline
