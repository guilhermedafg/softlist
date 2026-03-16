import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useChecklists from '../../../store/checklists'
import useExecucoes from '../../../store/execucoes'
import useAuth from '../../../store/auth'
import { storage, type FotoArmazenada } from '../../../db/storage'
import HistoryTimeline, { type FiltroHistorico } from '../../../components/history/HistoryTimeline'
import PhotoLightbox, { type FotoComMeta } from '../../../components/gallery/PhotoLightbox'
import AppShell from '../../../components/layout/AppShell'

const PaginaHistorico: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const { checklists, itens, buscarChecklists, buscarItens } = useChecklists()
  const { historico, buscarHistorico } = useExecucoes()

  const [filtro, setFiltro] = useState<FiltroHistorico>('30d')
  const [fotosPorExecucao, setFotosPorExecucao] = useState<Record<string, FotoArmazenada[]>>({})
  const [carregando, setCarregando] = useState(true)
  const [lightboxFotos, setLightboxFotos] = useState<FotoComMeta[] | null>(null)
  const [lightboxIndice, setLightboxIndice] = useState(0)

  const checklist = checklists.find((c) => c.id === id)
  const listaItens = (id ? itens[id] : undefined) ?? []

  // ── Carrega dados ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !usuario?.id) return

    const carregar = async () => {
      setCarregando(true)
      try {
        if (checklists.length === 0) await buscarChecklists(usuario.id)
        if (!itens[id]) await buscarItens(id)
        await buscarHistorico(id)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [id, usuario?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Carrega fotos do IndexedDB para cada execução ────────────────────────

  useEffect(() => {
    if (historico.length === 0) return

    const carregarFotos = async () => {
      const resultado: Record<string, FotoArmazenada[]> = {}
      await Promise.all(
        historico.map(async (exec) => {
          try {
            const fotos = await storage.buscarFotosPorExecucao(exec.id)
            if (fotos.length > 0) resultado[exec.id] = fotos
          } catch {
            // Silencioso — IndexedDB pode não ter dados
          }
        }),
      )
      setFotosPorExecucao(resultado)
    }
    carregarFotos()
  }, [historico])

  // ── Lightbox ─────────────────────────────────────────────────────────────

  const handleAbrirFoto = (fotos: FotoComMeta[], indice: number) => {
    setLightboxFotos(fotos)
    setLightboxIndice(indice)
  }

  const handleFecharLightbox = () => setLightboxFotos(null)

  // ── Render ───────────────────────────────────────────────────────────────

  const totalFotos = Object.values(fotosPorExecucao).reduce((acc, arr) => acc + arr.length, 0)

  return (
    <AppShell
      titulo="Histórico"
      rotaVoltar={`/checklists/${id}`}
      larguraMax="lg"
      acaoDireita={
        totalFotos > 0 ? (
          <button
            onClick={() => navegar(`/checklists/${id}/galeria`)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600
                       hover:text-black transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Galeria ({totalFotos})
          </button>
        ) : undefined
      }
    >
      {/* Cabeçalho da página */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-black">
          {checklist?.titulo ?? '—'}
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {historico.length} execuç{historico.length === 1 ? 'ão' : 'ões'} registrada{historico.length !== 1 ? 's' : ''}
        </p>
      </div>

      {carregando ? (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-black rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Carregando histórico...</p>
          </div>
        </div>
      ) : (
        <HistoryTimeline
          execucoes={historico}
          itens={listaItens}
          fotosPorExecucao={fotosPorExecucao}
          filtro={filtro}
          aoMudarFiltro={setFiltro}
          aoAbrirFoto={handleAbrirFoto}
        />
      )}

      {/* Lightbox */}
      {lightboxFotos && (
        <PhotoLightbox
          fotos={lightboxFotos}
          indiceInicial={lightboxIndice}
          aoFechar={handleFecharLightbox}
        />
      )}
    </AppShell>
  )
}

export default PaginaHistorico
