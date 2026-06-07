import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  /** Conteúdo fixo no rodapé — nunca rola, botão sempre visível */
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      ref={overlayRef}
      className={clsx(
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4',
        'bg-black/50 backdrop-blur-sm',
        'animate-fade-in',
      )}
      onClick={(e) => { if (closeOnBackdrop && e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/*
       * Container: flex-col + max-h SEM overflow-hidden
       * ─────────────────────────────────────────────────
       * ⚠️  overflow-hidden + border-radius clipa o padding
       *    do footer, cortando o botão — NÃO usar aqui.
       *
       * O scroll é contido pelo  min-h-0  no body,
       * que é o mecanismo correto em Flexbox:
       *   sem min-h-0 → flex-1 cresce além do max-h
       *   com min-h-0 → flex-1 encolhe e overflow-y-auto rola
       */}
      <div
        className={clsx(
          'relative w-full bg-white shadow-2xl',
          'flex flex-col',
          'max-h-[95vh] sm:max-h-[90vh]',   // SEM overflow-hidden
          'rounded-t-3xl sm:rounded-2xl',
          'animate-scale-in',
          sizeClasses[size],
        )}
      >
        {/* ── Header — flex-shrink-0 (nunca comprime) ── */}
        {title ? (
          <div className="flex-shrink-0 flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-gray-900">{title}</h2>
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="ml-4 flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex-shrink-0 flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1.5 rounded-full bg-gray-200" />
          </div>
        )}

        {/*
         * ── Body — scroll acontece AQUI ───────────────
         *
         *   flex-1     → ocupa todo o espaço restante entre header e footer
         *   min-h-0    → permite shrink abaixo do tamanho intrínseco (CRÍTICO)
         *   overflow-y-auto → ativa scroll quando conteúdo excede altura disponível
         */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 py-5">
          {!title && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          )}
          {children}
        </div>

        {/*
         * ── Footer — flex-shrink-0 (nunca comprime) ──
         *
         * Fica FORA da área scrollável.
         * O botão de ação fica sempre totalmente visível.
         * py-4 garante espaço generoso sem compressão.
         */}
        {footer && (
          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 bg-white sm:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
