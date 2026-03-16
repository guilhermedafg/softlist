import React, { useEffect, useState, useCallback, useRef } from 'react'
import { formatarTamanho } from '../../hooks/usePhotoUpload'

// ─── Tipo exportado (usado também no histórico) ───────────────────────────────

export interface FotoComMeta {
  id: string
  dataUrl: string
  tamanhoBytes: number
  capturadaEm: string
  itemId: string
  itemTitulo: string
  execucaoId: string
  executadaEm: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PropsPhotoLightbox {
  fotos: FotoComMeta[]
  indiceInicial?: number
  aoFechar: () => void
  aoRemoverFoto?: (fotoId: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatarDataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// ─── Componente ───────────────────────────────────────────────────────────────

const PhotoLightbox: React.FC<PropsPhotoLightbox> = ({
  fotos,
  indiceInicial = 0,
  aoFechar,
  aoRemoverFoto,
}) => {
  const [indice, setIndice] = useState(indiceInicial)
  const [mostrarInfo, setMostrarInfo] = useState(true)
  const [animandoSaida, setAnimandoSaida] = useState(false)
  const [direcaoSlide, setDirecaoSlide] = useState<'esq' | 'dir' | null>(null)
  const [confirmandoDelete, setConfirmandoDelete] = useState(false)

  // Touch swipe
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const fotoAtual = fotos[indice]

  // ── Navegação ──────────────────────────────────────────────────────────────

  const irParaAnterior = useCallback(() => {
    if (indice <= 0) return
    setDirecaoSlide('dir')
    setTimeout(() => { setIndice((i) => i - 1); setDirecaoSlide(null) }, 120)
  }, [indice])

  const irParaProxima = useCallback(() => {
    if (indice >= fotos.length - 1) return
    setDirecaoSlide('esq')
    setTimeout(() => { setIndice((i) => i + 1); setDirecaoSlide(null) }, 120)
  }, [indice, fotos.length])

  const fechar = useCallback(() => {
    setAnimandoSaida(true)
    setTimeout(aoFechar, 180)
  }, [aoFechar])

  // ── Teclado ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar()
      if (e.key === 'ArrowLeft') irParaAnterior()
      if (e.key === 'ArrowRight') irParaProxima()
      if (e.key === 'i') setMostrarInfo((v) => !v)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [fechar, irParaAnterior, irParaProxima])

  // Trava scroll do body
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // ── Touch / swipe ──────────────────────────────────────────────────────────

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = touchStartX.current - e.changedTouches[0].clientX
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY)
    // Só swipe horizontal (não scroll vertical)
    if (Math.abs(dx) > 48 && Math.abs(dx) > dy) {
      dx > 0 ? irParaProxima() : irParaAnterior()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = () => {
    if (!aoRemoverFoto || !fotoAtual) return
    aoRemoverFoto(fotoAtual.id)
    setConfirmandoDelete(false)
    // Navega para a foto anterior se possível, ou fecha se for a última
    if (fotos.length === 1) {
      fechar()
    } else {
      setIndice((i) => Math.max(0, i - 1))
    }
  }

  if (!fotoAtual) return null

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex flex-col bg-black/95',
        'transition-opacity duration-180',
        animandoSaida ? 'opacity-0' : 'opacity-100',
      ].join(' ')}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/40">
        <div className="flex items-center gap-3">
          <button
            onClick={fechar}
            aria-label="Fechar"
            className="w-8 h-8 flex items-center justify-center rounded-full
                       text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-white/60 text-sm tabular-nums">
            {indice + 1} / {fotos.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle info */}
          <button
            onClick={() => setMostrarInfo((v) => !v)}
            aria-label="Mostrar/ocultar informações"
            className={[
              'w-8 h-8 flex items-center justify-center rounded-full transition-colors text-sm',
              mostrarInfo
                ? 'bg-white/20 text-white'
                : 'text-white/40 hover:text-white hover:bg-white/10',
            ].join(' ')}
          >
            ℹ
          </button>

          {/* Excluir */}
          {aoRemoverFoto && !confirmandoDelete && (
            <button
              onClick={() => setConfirmandoDelete(true)}
              aria-label="Excluir foto"
              className="w-8 h-8 flex items-center justify-center rounded-full
                         text-white/50 hover:text-error hover:bg-red-500/10 transition-colors"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Confirmar delete */}
          {confirmandoDelete && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmandoDelete(false)}
                className="text-xs text-white/60 px-2 py-1 rounded hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-error bg-red-500/20 border border-red-500/30
                           px-3 py-1.5 rounded-full font-semibold hover:bg-red-500/30 transition-colors"
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Área da imagem ── */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Botão anterior */}
        <button
          onClick={irParaAnterior}
          disabled={indice === 0}
          aria-label="Foto anterior"
          className={[
            'absolute left-3 z-10 w-10 h-10 flex items-center justify-center',
            'rounded-full bg-black/40 text-white transition-all duration-150',
            indice === 0
              ? 'opacity-0 pointer-events-none'
              : 'opacity-70 hover:opacity-100 hover:bg-black/60 hover:scale-110',
          ].join(' ')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Imagem */}
        <img
          key={fotoAtual.id}
          src={fotoAtual.dataUrl}
          alt={`Foto: ${fotoAtual.itemTitulo}`}
          className={[
            'max-h-full max-w-full object-contain select-none',
            'transition-all duration-120',
            direcaoSlide === 'esq' ? '-translate-x-4 opacity-0' : '',
            direcaoSlide === 'dir' ? 'translate-x-4 opacity-0' : '',
          ].join(' ')}
          draggable={false}
        />

        {/* Botão próxima */}
        <button
          onClick={irParaProxima}
          disabled={indice === fotos.length - 1}
          aria-label="Próxima foto"
          className={[
            'absolute right-3 z-10 w-10 h-10 flex items-center justify-center',
            'rounded-full bg-black/40 text-white transition-all duration-150',
            indice === fotos.length - 1
              ? 'opacity-0 pointer-events-none'
              : 'opacity-70 hover:opacity-100 hover:bg-black/60 hover:scale-110',
          ].join(' ')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ── Info overlay ── */}
      {mostrarInfo && (
        <div className="flex-shrink-0 px-4 py-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-semibold text-sm truncate">
            {fotoAtual.itemTitulo}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-white/60 text-xs">
              {formatarDataHora(fotoAtual.capturadaEm)}
            </span>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-white/60 text-xs">
              {formatarTamanho(fotoAtual.tamanhoBytes)}
            </span>
          </div>
        </div>
      )}

      {/* ── Dots de paginação ── */}
      {fotos.length > 1 && fotos.length <= 20 && (
        <div className="flex-shrink-0 flex justify-center gap-1.5 pb-4">
          {fotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndice(i)}
              className={[
                'rounded-full transition-all duration-200',
                i === indice ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PhotoLightbox
