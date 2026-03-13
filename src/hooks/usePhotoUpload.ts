import { useState, useCallback } from 'react'
import imageCompression from 'browser-image-compression'

// ─── Tipo exportado ──────────────────────────────────────────────────────────

export interface FotoLocal {
  id: string
  dataUrl: string       // base64 JPEG comprimida
  tamanhoBytes: number
  capturadaEm: string
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const MAX_RAW_BYTES = 10 * 1024 * 1024   // 10 MB bruto
const TARGET_MAX_MB = 0.2                 // comprime até ~200KB

const formatarTamanho = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export { formatarTamanho }

// ─── Hook ────────────────────────────────────────────────────────────────────

interface ResultadoHook {
  estaProcessando: boolean
  erro: string | null
  processarArquivo: (arquivo: File) => Promise<FotoLocal | null>
  limparErro: () => void
}

export function usePhotoUpload(): ResultadoHook {
  const [estaProcessando, setEstaProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const processarArquivo = useCallback(async (arquivo: File): Promise<FotoLocal | null> => {
    setErro(null)

    // Validação de tipo
    if (!TIPOS_PERMITIDOS.has(arquivo.type)) {
      setErro('Apenas imagens JPG, PNG ou WebP são permitidas.')
      return null
    }

    // Validação de tamanho bruto
    if (arquivo.size > MAX_RAW_BYTES) {
      setErro(`Imagem muito grande. Máximo ${formatarTamanho(MAX_RAW_BYTES)} antes de comprimir.`)
      return null
    }

    setEstaProcessando(true)
    try {
      const comprimida = await imageCompression(arquivo, {
        maxSizeMB: TARGET_MAX_MB,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.85,
        onProgress: () => undefined, // silencia logs internos
      })

      const dataUrl = await imageCompression.getDataUrlFromFile(comprimida)

      return {
        id: crypto.randomUUID(),
        dataUrl,
        tamanhoBytes: comprimida.size,
        capturadaEm: new Date().toISOString(),
      }
    } catch {
      setErro('Não foi possível processar a imagem. Tente novamente.')
      return null
    } finally {
      setEstaProcessando(false)
    }
  }, [])

  const limparErro = useCallback(() => setErro(null), [])

  return { estaProcessando, erro, processarArquivo, limparErro }
}
