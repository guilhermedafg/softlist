import React, { useRef, useState } from 'react'
import { usePhotoUpload, formatarTamanho, type FotoLocal } from '../../hooks/usePhotoUpload'

// ─── Props ────────────────────────────────────────────────────────────────────

interface PropsPhotoUpload {
  fotos: FotoLocal[]
  aoAdicionarFoto: (foto: FotoLocal) => void
  aoRemoverFoto: (fotoId: string) => void
  /** Desabilitado: bloqueia adicionar mas mantém thumbnails visíveis */
  disabled?: boolean
  /** Label customizado para o botão */
  labelBotao?: string
}

// ─── Componente de preview (antes de confirmar) ───────────────────────────────

interface PropsPreviewPendente {
  foto: FotoLocal
  aoConfirmar: () => void
  aoCancelar: () => void
}

const PreviewPendente: React.FC<PropsPreviewPendente> = ({ foto, aoConfirmar, aoCancelar }) => (
  <div className="border-2 border-dashed border-black rounded-xl overflow-hidden">
    {/* Imagem */}
    <div className="relative">
      <img
        src={foto.dataUrl}
        alt="Preview da foto"
        className="w-full max-h-64 object-contain bg-gray-50"
      />
      <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
        Preview
      </span>
    </div>

    {/* Info + ações */}
    <div className="p-3 bg-gray-50 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold text-gray-700">Foto pronta</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatarTamanho(foto.tamanhoBytes)} · JPEG comprimido
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={aoCancelar}
          className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg
                     text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={aoConfirmar}
          className="px-3 py-1.5 text-xs font-semibold bg-black text-white rounded-lg
                     hover:bg-gray-800 transition-colors"
        >
          ✓ Usar foto
        </button>
      </div>
    </div>
  </div>
)

// ─── Thumbnail de foto confirmada ─────────────────────────────────────────────

interface PropsThumbnail {
  foto: FotoLocal
  indice: number
  aoRemover: () => void
  disabled: boolean
}

const Thumbnail: React.FC<PropsThumbnail> = ({ foto, indice, aoRemover, disabled }) => {
  const [expandida, setExpandida] = useState(false)

  return (
    <>
      <div className="relative group flex-shrink-0">
        <button
          type="button"
          onClick={() => setExpandida(true)}
          className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200
                     hover:border-black transition-colors focus:outline-none focus:border-black"
        >
          <img
            src={foto.dataUrl}
            alt={`Foto ${indice + 1}`}
            className="w-full h-full object-cover"
          />
        </button>

        {/* Botão remover */}
        {!disabled && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); aoRemover() }}
            aria-label="Remover foto"
            className="absolute -top-2 -right-2 w-5 h-5 bg-error text-white rounded-full
                       flex items-center justify-center text-xs font-bold
                       opacity-0 group-hover:opacity-100 transition-opacity
                       hover:bg-red-700 focus:opacity-100 focus:outline-none"
          >
            ×
          </button>
        )}

        {/* Tamanho */}
        <p className="text-xs text-gray-400 text-center mt-1">
          {formatarTamanho(foto.tamanhoBytes)}
        </p>
      </div>

      {/* Modal de expansão */}
      {expandida && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandida(false)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={foto.dataUrl}
              alt={`Foto ${indice + 1} ampliada`}
              className="w-full rounded-xl object-contain max-h-[80vh]"
            />
            <button
              onClick={() => setExpandida(false)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full
                         flex items-center justify-center hover:bg-black transition-colors"
            >
              ×
            </button>
            <p className="text-center text-white/60 text-xs mt-3">
              {new Date(foto.capturadaEm).toLocaleString('pt-BR')} · {formatarTamanho(foto.tamanhoBytes)}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const PhotoUpload: React.FC<PropsPhotoUpload> = ({
  fotos,
  aoAdicionarFoto,
  aoRemoverFoto,
  disabled = false,
  labelBotao = 'Adicionar foto',
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { estaProcessando, erro, processarArquivo, limparErro } = usePhotoUpload()
  const [fotaPendente, setFotaPendente] = useState<FotoLocal | null>(null)

  const handleArquivoSelecionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    // Reseta input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
    if (!arquivo) return

    limparErro()
    const resultado = await processarArquivo(arquivo)
    if (resultado) setFotaPendente(resultado)
  }

  const handleConfirmar = () => {
    if (!fotaPendente) return
    aoAdicionarFoto(fotaPendente)
    setFotaPendente(null)
  }

  const handleCancelar = () => {
    setFotaPendente(null)
    limparErro()
  }

  return (
    <div className="space-y-3">
      {/* Thumbnails de fotos confirmadas */}
      {fotos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {fotos.map((foto, i) => (
            <Thumbnail
              key={foto.id}
              foto={foto}
              indice={i}
              aoRemover={() => aoRemoverFoto(foto.id)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* Preview pendente (aguardando confirmação) */}
      {fotaPendente && (
        <PreviewPendente
          foto={fotaPendente}
          aoConfirmar={handleConfirmar}
          aoCancelar={handleCancelar}
        />
      )}

      {/* Erro de validação/compressão */}
      {erro && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <svg className="w-4 h-4 text-error flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs text-error">{erro}</p>
          <button onClick={limparErro} className="ml-auto text-error hover:text-red-700 text-sm">×</button>
        </div>
      )}

      {/* Botão de adicionar foto (oculto quando preview pendente) */}
      {!fotaPendente && !disabled && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={handleArquivoSelecionado}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={estaProcessando}
            className={[
              'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed',
              'text-sm font-medium transition-all duration-150 focus:outline-none',
              estaProcessando
                ? 'border-gray-200 text-gray-300 cursor-wait'
                : 'border-gray-200 text-gray-500 hover:border-black hover:text-black hover:bg-gray-50',
            ].join(' ')}
          >
            {estaProcessando ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {labelBotao}
                {fotos.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    {fotos.length}
                  </span>
                )}
              </>
            )}
          </button>
          <p className="text-xs text-gray-300 mt-1.5">
            JPG, PNG ou WebP · Comprimido automaticamente para ~200KB
          </p>
        </div>
      )}
    </div>
  )
}

export default PhotoUpload
