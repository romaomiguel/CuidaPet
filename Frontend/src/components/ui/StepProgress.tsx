import clsx from 'clsx'

interface StepProgressProps {
  step: number
  totalSteps: number
  label?: string
  className?: string
}

/**
 * Barra de progresso segmentada do wizard Match Inteligente
 * ("Passo X de N" + N segmentos, os anteriores/atual preenchidos).
 */
export function StepProgress({ step, totalSteps, label, className }: StepProgressProps) {
  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-muted">
          Passo {step} de {totalSteps}
        </span>
        {label && (
          <span className="badge badge-blue">{label}</span>
        )}
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={clsx(
              'h-2 flex-1 rounded-pill transition-all duration-300',
              i < step ? 'bg-primary-500' : 'bg-stroke',
            )}
          />
        ))}
      </div>
    </div>
  )
}
