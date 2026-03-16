import React, { useRef, useEffect } from 'react'
import type { ItemChecklist } from '../../db/schema'
import { LABEL_DIA, LABEL_RECORRENCIA } from '../../db/schema'
import type { RespostaItemLocal } from '../../api/execucoes-endpoints'
import type { FotoLocal } from '../../hooks/usePhotoUpload'
import PhotoUpload from '../common/PhotoUpload'

interface PropsExecutionItem {
  item: ItemChecklist
  resposta: RespostaItemLocal | undefined
  fotos: FotoLocal[]
  /** Índice visual (1-based) */
  numero: number
  estaAtivo: boolean
  aoToggle: () => void
  aoAtualizarNota: (nota: string) => void
  aoAdicionarFoto: (foto: FotoLocal) => void
  aoRemoverFoto: (fotoId: string) => void
}

const ExecutionItem: React.FC<PropsExecutionItem> = ({
  item,
  resposta,
  fotos,
  numero,
  estaAtivo,
  aoToggle,
  aoAtualizarNota,
  aoAdicionarFoto,
  aoRemoverFoto,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const concluido = resposta?.status === 'concluido'
  const naoAplicavel = resposta?.status === 'nao_aplicavel'
  const marcado = concluido || naoAplicavel

  // Bloqueia conclusão se foto obrigatória ainda não foi adicionada
  const bloqueadoPorFoto = item.requerEvidencia && fotos.length === 0 && !naoAplicavel

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [resposta?.observacao])

  const diasLabel = item.diasSemana.includes('todos')
    ? 'Todos os dias'
    : item.diasSemana.map((d) => LABEL_DIA[d]).join(', ')

  const handleToggle = () => {
    if (bloqueadoPorFoto) return // bloqueado por foto obrigatória
    aoToggle()
  }

  return (
    <div
      className={[
        'rounded-xl border-2 transition-all duration-300 overflow-hidden',
        concluido
          ? 'border-success/40 bg-green-50'
          : naoAplicavel
          ? 'border-gray-200 bg-gray-50'
          : estaAtivo
          ? 'border-black bg-white shadow-lg animate-item-pulse'
          : 'border-gray-200 bg-white',
      ].join(' ')}
    >
      {/* Barra superior colorida por estado */}
      <div
        className={[
          'h-1 w-full transition-all duration-500',
          concluido
            ? 'bg-success'
            : naoAplicavel
            ? 'bg-gray-300'
            : estaAtivo
            ? 'bg-black'
            : 'bg-transparent',
        ].join(' ')}
      />

      <div className="p-6">
        {/* ── Header ── */}
        <div className="flex items-start gap-4">
          {/* Checkbox / botão de toggle */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={handleToggle}
              aria-label={
                bloqueadoPorFoto
                  ? 'Adicione uma foto para concluir'
                  : concluido
                  ? 'Desmarcar item'
                  : 'Marcar como concluído'
              }
              disabled={bloqueadoPorFoto}
              className={[
                'w-11 h-11 rounded-full border-2 flex items-center justify-center',
                'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                'select-none',
                bloqueadoPorFoto
                  ? 'border-error/40 bg-red-50 cursor-not-allowed'
                  : concluido
                  ? 'bg-success border-success text-white focus:ring-success cursor-pointer animate-check-pop'
                  : naoAplicavel
                  ? 'bg-gray-200 border-gray-300 text-gray-400 focus:ring-gray-300 cursor-pointer'
                  : 'border-gray-300 bg-white hover:border-black hover:bg-gray-50 focus:ring-black cursor-pointer',
              ].join(' ')}
            >
              {concluido && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {naoAplicavel && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              )}
              {bloqueadoPorFoto && (
                <svg className="w-4 h-4 text-error/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {!marcado && !bloqueadoPorFoto && (
                <span className="text-xs font-bold text-gray-300">{numero}</span>
              )}
            </button>
          </div>

          {/* Título + badges */}
          <div className="flex-1 min-w-0 pt-1">
            <h3
              className={[
                'text-xl font-bold leading-snug transition-all duration-300',
                concluido || naoAplicavel ? 'line-through text-gray-400' : 'text-black',
              ].join(' ')}
            >
              {item.titulo}
            </h3>

            {/* Meta: horário, dias, recorrência */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
                {item.horario}
              </span>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-500">{diasLabel}</span>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">{LABEL_RECORRENCIA[item.recorrencia]}</span>
            </div>

            {/* Badges de status */}
            <div className="flex flex-wrap gap-2 mt-3">
              {item.requerEvidencia && (
                <span
                  className={[
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full',
                    'text-xs font-semibold uppercase tracking-wide',
                    fotos.length > 0
                      ? 'bg-success/10 border border-success/30 text-success'
                      : 'bg-error/10 border border-error/30 text-error',
                  ].join(' ')}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {fotos.length > 0 ? `${fotos.length} foto${fotos.length > 1 ? 's' : ''}` : 'Foto obrigatória'}
                </span>
              )}
              {concluido && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                                 bg-success/10 border border-success/30 text-success
                                 text-xs font-semibold">
                  ✓ Concluído
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Aviso de foto obrigatória ── */}
        {bloqueadoPorFoto && (
          <div
            className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg"
            style={{ marginLeft: '60px' }}
          >
            <svg className="w-4 h-4 text-error flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-error font-medium">
              Adicione pelo menos uma foto para poder concluir este item.
            </p>
          </div>
        )}

        {/* ── Descrição ── */}
        {item.descricao && (
          <p
            className={`mt-4 text-sm leading-relaxed ${concluido ? 'text-gray-400' : 'text-gray-600'}`}
            style={{ paddingLeft: '60px' }}
          >
            {item.descricao}
          </p>
        )}

        {/* ── Upload de fotos ── */}
        <div className="mt-5" style={{ paddingLeft: '60px' }}>
          {(item.requerEvidencia || fotos.length > 0) && (
            <>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                {item.requerEvidencia ? 'Evidência fotográfica *' : 'Fotos'}
              </label>
              <PhotoUpload
                fotos={fotos}
                aoAdicionarFoto={aoAdicionarFoto}
                aoRemoverFoto={aoRemoverFoto}
                disabled={concluido}
                labelBotao={item.requerEvidencia ? 'Tirar/Selecionar foto' : 'Adicionar foto'}
              />
            </>
          )}

          {/* Botão de adicionar foto para itens sem requerEvidencia */}
          {!item.requerEvidencia && fotos.length === 0 && (
            <PhotoUpload
              fotos={fotos}
              aoAdicionarFoto={aoAdicionarFoto}
              aoRemoverFoto={aoRemoverFoto}
              disabled={concluido}
              labelBotao="Adicionar foto"
            />
          )}
        </div>

        {/* ── Notas ── */}
        <div className="mt-4" style={{ paddingLeft: '60px' }}>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Anotações
          </label>
          <textarea
            ref={textareaRef}
            value={resposta?.observacao ?? ''}
            onChange={(e) => aoAtualizarNota(e.target.value)}
            placeholder={
              concluido
                ? 'Observações sobre este item...'
                : 'Descreva o que foi verificado, problemas encontrados...'
            }
            rows={2}
            className={[
              'w-full px-3 py-2.5 rounded-lg border text-sm resize-none',
              'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
              'transition-all duration-150 placeholder:text-gray-300 min-h-[80px]',
              concluido
                ? 'bg-green-50/50 border-green-200 text-gray-600'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300',
            ].join(' ')}
          />
          {(resposta?.observacao ?? '').length > 0 && (
            <p className="text-xs text-gray-300 mt-1 text-right">Salvo automaticamente</p>
          )}
        </div>

        {/* ── Botão N/A ── */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={aoToggle}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            {naoAplicavel ? 'Desfazer não aplicável' : 'Marcar como não aplicável'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExecutionItem
