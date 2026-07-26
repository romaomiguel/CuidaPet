import { useState } from 'react'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { supportMessageService } from '@/services/supportMessage.service'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

const EMPTY_FORM = { name: '', email: '', contact: '', question: '' }

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await supportMessageService.create({
        name: form.name.trim(),
        email: form.email.trim(),
        contact: form.contact.trim() || undefined,
        question: form.question.trim(),
      })
      toast.success('Mensagem enviada! Vamos responder pelo e-mail informado.')
      setForm(EMPTY_FORM)
      onClose()
    } catch {
      toast.error('Não foi possível enviar sua mensagem. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Falar com o suporte"
      description="Conta pra gente o que aconteceu — respondemos pelo e-mail informado."
      size="md"
      footer={
        <button
          type="submit"
          form="support-form"
          disabled={submitting}
          className="btn-primary w-full py-3"
        >
          <Send size={16} /> {submitting ? 'Enviando...' : 'Enviar mensagem'}
        </button>
      }
    >
      <form id="support-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="support-name">Nome</label>
          <input
            id="support-name"
            type="text"
            required
            minLength={2}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="input-field"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className="label" htmlFor="support-email">E-mail</label>
          <input
            id="support-email"
            type="email"
            required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="input-field"
            placeholder="seuemail@exemplo.com"
          />
        </div>

        <div>
          <label className="label" htmlFor="support-contact">Contato (opcional)</label>
          <input
            id="support-contact"
            type="text"
            value={form.contact}
            onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
            className="input-field"
            placeholder="Telefone ou WhatsApp"
          />
        </div>

        <div>
          <label className="label" htmlFor="support-question">Sua dúvida</label>
          <textarea
            id="support-question"
            required
            minLength={5}
            rows={4}
            value={form.question}
            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            className="input-field !rounded-2xl resize-none"
            placeholder="Conte com detalhes o que você precisa..."
          />
        </div>
      </form>
    </Modal>
  )
}
