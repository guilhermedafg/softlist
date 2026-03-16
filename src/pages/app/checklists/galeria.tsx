import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import useChecklists from '../../../store/checklists'
import useAuth from '../../../store/auth'
import { execucoesApi } from '../../../api/execucoes-endpoints'
import { storage } from '../../../db/storage'
import PhotoLightbox, { type FotoComMeta } from '../../../components/gallery/PhotoLightbox'
import AppShell from '../../../components/layout/AppShell'
import { formatarTamanho } from '../../../hooks/usePhotoUpload'

// ─── Filtro por item ──────────────────────────────────────────────────────────

type OrdemGaleria = 'recente' | 'antiga' | 'item'

const ORDENS: { valor: OrdemGaleria; label: string }[] = [
  { valor: 'recente', label: 'Mais recente' },
  { valor: 'antiga', label: 'Mais antiga' },
  { valor: 'item', label: 'Por item' },
]

// ─── Página ───────────────────────────────────────────────────────────────────

const PaginaGaleria: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { usuario } = useAuth()
  const { checklists, itens, buscarChecklists, buscarItens } = useChecklists()

  const [fotos, setFotos] = useState<FotoComMeta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [ordem, setOrdem] = useState<OrdemGaleria>('recente')
  const [filtroItem, setFiltroItem] = useState<string>('todos')
  const [lightboxIndice, setLightboxIndice] = useState<number | null>(null)

  const checklist = checklists.find((c) => c.id === id)
  const listaItens = (id ? itens[id] : undefined) ?? []

  // ── Carrega fotos ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !usuario?.id) return

    const carregar = async () => {
      setCarregando(true)
      try {
        if (checklists.length === 0) await buscarChecklists(usuario.id)
        if (!itens[id]) await buscarItens(id)

        // Busca todas as execuções do checklist
        const execucoes = await execucoesApi.listarPorChecklist(id)

        // Para cada execução, busca as fotos no IndexedDB
        const todasFotos: FotoComMeta[] = []
        await Promise.all(
          execucoes.map(async (exec) => {
            try {
              const fotosExec = await storage.buscarFotosPorExecucao(exec.id)
              for (const foto of fotosExec) {
                todasFotos.push({
                  id: foto.id,
                  dataUrl: foto.dataUrl,
                  tamanhoBytes: foto.tamanhoBytes,
                  capturadaEm: foto.capturadaEm,
                  itemId: foto.itemId,
                  itemTitulo: '—', // preenchido abaixo
                  execucaoId: exec.id,
                  executadaEm: exec.iniciadaEm,
                })
              }
            } catch {
              // Silencioso
            }
          }),
        )

        // Preenche título do item (itens pode não estar carregado ainda)
        const itensCarregados = itens[id] ?? []
        const mapeadoComTitulo = todasFotos.map((f) => ({
          ...f,
          itemTitulo:
            itensCarregados.find((it) => it.id === f.itemId)?.titulo ?? 'Item desconhecido',
        }))

        setFotos(mapeadoComTitulo)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [id, usuario?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Actualiza títulos quando itens carregarem
  useEffect(() => {
    if (listaItens.length === 0 || fotos.length === 0) return
    setFotos((prev) =>
      prev.map((f) => ({
        ...f,
        itemTitulo: listaItens.find((it) => it.id === f.itemId)?.titulo ?? f.itemTitulo,
      })),
    )
  }, [listaItens]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ordenação + filtro ────────────────────────────────────────────────────

  const fotosVisiveis = useMemo(() => {
    let resultado = filtroItem === 'todos' ? fotos : fotos.filter((f) => f.itemId === filtroItem)

    if (ordem === 'recente') resultado = [...resultado].sort((a, b) => b.capturadaEm.localeCompare(a.capturadaEm))
    else if (ordem === 'antiga') resultado = [...resultado].sort((a, b) => a.capturadaEm.localeCompare(b.capturadaEm))
    else resultado = [...resultado].sort((a, b) => a.itemTitulo.localeCompare(b.itemTitulo))

    return resultado
  }, [fotos, ordem, filtroItem])

  // Items que têm fotos (para o filtro)
  const itensComFotos = useMemo(() => {
    const ids = new Set(fotos.map((f) => f.itemId))
    return listaItens.filter((it) => ids.has(it.id))
  }, [fotos, listaItens])

  // Tamanho total
  const tamanhoTotal = useMemo(
    () => fotos.reduce((acc, f) => acc + f.tamanhoBytes, 0),
    [fotos],
  )

  // ── Lightbox ─────────────────────────────────────────────────────────────

  const handleAbrirFoto = (idx: number) => setLightboxIndice(idx)

  const handleRemoverFoto = async (fotoId: string) => {
    try {
      await storage.removerFoto(fotoId)
      setFotos((prev) => prev.filter((f) => f.id !== fotoId))
    } catch {
      // Silencioso
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AppShell
      titulo="Galeria de fotos"
      rotaVoltar={`/checklists/${id}`}
      larguraMax="xl"
    >
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-black">
            {checklist?.titulo ?? '—'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {fotos.length} foto{fotos.length !== 1 ? 's' : ''}
            {fotos.length > 0 && ` · ${formatarTamanho(tamanhoTotal)} total`}
          </p>
        </div>

        {/* Ordem */}
        <div className="flex items-center gap-2 flex-wrap">
          {ORDENS.map(({ valor, label }) => (
            <button
              key={valor}
              onClick={() => setOrdem(valor)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                ordem === valor
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro por item */}
      {itensComFotos.length > 1 && (
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setFiltroItem('todos')}
            className={[
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              filtroItem === 'todos'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            ].join(' ')}
          >
            Todos ({fotos.length})
          </button>
          {itensComFotos.map((item) => {
            const count = fotos.filter((f) => f.itemId === item.id).length
            return (
              <button
                key={item.id}
                onClick={() => setFiltroItem(item.id)}
                className={[
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  filtroItem === item.id
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                ].join(' ')}
              >
                {item.titulo.length > 20 ? item.titulo.slice(0, 20) + '…' : item.titulo} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Estados */}
      {carregando && (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Carregando fotos...</p>
          </div>
        </div>
      )}

      {!carregando && fotos.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">Nenhuma foto registrada.</p>
          <p className="text-gray-300 text-sm mt-1">
            Adicione fotos durante a execução do checklist.
          </p>
        </div>
      )}

      {!carregando && fotosVisiveis.length === 0 && fotos.length > 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          Nenhuma foto para o filtro selecionado.
        </div>
      )}

      {/* ── Grid ── */}
      {!carregando && fotosVisiveis.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          {fotosVisiveis.map((foto, i) => (
            <button
              key={foto.id}
              type="button"
              onClick={() => handleAbrirFoto(i)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100
                         focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
                         hover:scale-[1.02] transition-transform duration-150"
            >
              {/* Imagem */}
              <img
                src={foto.dataUrl}
                alt={foto.itemTitulo}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Overlay no hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20
                              transition-colors duration-150 flex items-end">
                <div className="w-full px-2 py-2 bg-gradient-to-t from-black/60 to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <p className="text-white text-xs font-medium truncate">
                    {foto.itemTitulo}
                  </p>
                  <p className="text-white/60 text-xs">
                    {new Date(foto.capturadaEm).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndice !== null && (
        <PhotoLightbox
          fotos={fotosVisiveis}
          indiceInicial={lightboxIndice}
          aoFechar={() => setLightboxIndice(null)}
          aoRemoverFoto={handleRemoverFoto}
        />
      )}
    </AppShell>
  )
}

export default PaginaGaleria
