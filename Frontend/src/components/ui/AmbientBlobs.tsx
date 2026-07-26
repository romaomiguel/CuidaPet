import clsx from 'clsx'

interface AmbientBlobsProps {
  className?: string
}

/**
 * Blobs desfocados animados de fundo — usados nas telas de auth e do
 * Match Inteligente (Stitch/Kindred Paws). Renderizar dentro de um
 * container `relative` com `overflow-hidden`.
 */
export function AmbientBlobs({ className }: AmbientBlobsProps) {
  return (
    <div className={clsx('absolute inset-0 -z-10 overflow-hidden pointer-events-none', className)} aria-hidden="true">
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl animate-pulse" />
      <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-secondary-300/40 blur-3xl animate-pulse [animation-delay:1s]" />
      <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-primary-100/50 blur-3xl animate-pulse [animation-delay:2s]" />
    </div>
  )
}
