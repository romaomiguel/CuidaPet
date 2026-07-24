import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { Modal } from '@/components/ui/Modal'
import { RatingStars } from '@/components/ui/RatingStars'
import { reviewService } from '@/services/review.service'
import { REVIEW_TAGS_BY_RATING } from '@/constants/reviewTags'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  petsitterId: string
  petsitterName: string
}

export function ReviewModal({ isOpen, onClose, bookingId, petsitterId, petsitterName }: ReviewModalProps) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Reseta o form sempre que o modal abre pra um booking novo (o componente é
  // reaproveitado entre aberturas, não desmonta a cada troca de booking).
  useEffect(() => {
    if (isOpen) {
      setRating(0)
      setComment('')
      setSelectedTags([])
    }
  }, [isOpen, bookingId])

  const availableTags = REVIEW_TAGS_BY_RATING[rating] ?? []

  // Ao trocar a nota, tags que não pertencem ao novo conjunto são desmarcadas —
  // regra de produto: cada nota tem seu próprio conjunto fechado de tags.
  const handleRatingChange = (value: number) => {
    setRating(value)
    const nextAvailable = REVIEW_TAGS_BY_RATING[value] ?? []
    setSelectedTags(prev => prev.filter(t => nextAvailable.includes(t)))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const mutation = useMutation({
    mutationFn: () => reviewService.create({
      bookingId,
      petsitterId,
      rating,
      tags: selectedTags.length ? selectedTags : undefined,
      comment: comment.trim() || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Avaliação enviada com sucesso!')
      onClose()
    },
    // Erro (incluindo 409 de review duplicada) já vira toast pelo interceptor
    // de resposta do axios (lib/axios.ts) — não duplica a mensagem aqui.
  })

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Selecione uma nota de 1 a 5 estrelas.')
      return
    }
    mutation.mutate()
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="btn-primary"
      >
        {mutation.isPending ? 'Enviando…' : 'Enviar avaliação'}
      </button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Avaliar serviço"
      description={`Como foi sua experiência com ${petsitterName}?`}
      size="sm"
      footer={footer}
    >
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-2 py-2">
          <RatingStars value={rating} onChange={handleRatingChange} interactive size="lg" />
          <p className="text-xs text-gray-400">
            {rating > 0 ? `${rating} de 5 estrelas` : 'Toque em uma estrela para avaliar'}
          </p>
        </div>

        {availableTags.length > 0 && (
          <div>
            <p className="label mb-2">Quer destacar algo? (opcional)</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      active
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300',
                    )}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <label className="label" htmlFor="review-comment">Comentário (opcional)</label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
            className="input-field resize-none"
            placeholder="Conte como foi o serviço..."
          />
        </div>
      </div>
    </Modal>
  )
}
