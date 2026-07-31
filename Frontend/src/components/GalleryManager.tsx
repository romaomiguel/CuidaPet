import { useRef, useState } from 'react'
import { Camera, X, Images } from 'lucide-react'
import toast from 'react-hot-toast'

interface GalleryManagerProps {
  photos: string[]
  onUpload: (file: File) => Promise<string[]>
  onRemove: (index: number) => Promise<string[]>
  maxPhotos?: number
}

/**
 * Grid de fotos com upload/remoção — usado pelo painel do Petsitter e do Parceiro.
 * `photos` são signed URLs prontas pra exibir; a primeira funciona como "banner"
 * (mesma convenção usada pelas páginas públicas de detalhe). A remoção é por ÍNDICE
 * (posição no array), não pela URL — o backend resolve o path real internamente a
 * partir da posição, já que o frontend nunca tem acesso ao path cru do Storage.
 */
export function GalleryManager({ photos, onUpload, onRemove, maxPhotos = 8 }: GalleryManagerProps) {
  const [localPhotos, setLocalPhotos] = useState(photos)
  const [isUploading, setIsUploading] = useState(false)
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (máx 5MB)'); return }
    if (localPhotos.length >= maxPhotos) { toast.error(`Limite de ${maxPhotos} fotos atingido.`); return }

    try {
      setIsUploading(true)
      const updated = await onUpload(file)
      setLocalPhotos(updated)
      toast.success('Foto adicionada!')
    } catch {
      // Erro real já vira toast pelo interceptor de resposta do axios.
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleRemove = async (index: number) => {
    try {
      setRemovingIndex(index)
      const updated = await onRemove(index)
      setLocalPhotos(updated)
      toast.success('Foto removida.')
    } catch {
      // Erro real já vira toast pelo interceptor de resposta do axios.
    } finally {
      setRemovingIndex(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted">
          A primeira foto é usada como banner do seu perfil público. Até {maxPhotos} fotos.
        </p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading || localPhotos.length >= maxPhotos}
          className="btn-outline text-sm px-4 py-2 self-start sm:flex-shrink-0 disabled:opacity-50"
        >
          {isUploading
            ? <span className="w-4 h-4 border-2 border-primary-800/30 border-t-primary-800 rounded-full animate-spin" />
            : <Camera size={16} />}
          {isUploading ? 'Enviando…' : 'Adicionar foto'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={handleUpload} />
      </div>

      {localPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10 bg-background rounded-2xl">
          <Images size={32} className="text-stroke mb-3" />
          <p className="text-muted text-sm font-medium">Nenhuma foto adicionada ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {localPhotos.map((photo, i) => (
            <div key={photo} className="relative group">
              <img
                src={photo}
                alt={`Foto ${i + 1}`}
                loading="lazy"
                className="w-full aspect-square object-cover rounded-2xl shadow-sm"
              />
              {i === 0 && (
                <span className="absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-pill bg-ink/70 text-white backdrop-blur-sm">
                  Banner
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                disabled={removingIndex === i}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity disabled:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                title="Remover foto"
              >
                {removingIndex === i
                  ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <X size={14} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
