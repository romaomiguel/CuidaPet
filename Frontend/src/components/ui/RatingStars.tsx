import { useState } from 'react'
import { Star } from 'lucide-react'
import clsx from 'clsx'

interface RatingStarsProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (value: number) => void
  showValue?: boolean
  className?: string
}

const sizeMap = {
  sm: 14,
  md: 18,
  lg: 24,
}

export function RatingStars({
  value,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  className,
}: RatingStarsProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const displayValue = hovered ?? value
  const pixelSize = sizeMap[size]

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1
        const filled = starValue <= displayValue

        return (
          <button
            key={i}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onMouseEnter={() => interactive && setHovered(starValue)}
            onMouseLeave={() => interactive && setHovered(null)}
            onClick={() => interactive && onChange?.(starValue)}
            className={clsx(
              'transition-transform duration-100',
              interactive && 'hover:scale-125 cursor-pointer',
              !interactive && 'cursor-default pointer-events-none',
            )}
            aria-label={interactive ? `Avaliar com ${starValue} estrela${starValue > 1 ? 's' : ''}` : undefined}
          >
            <Star
              size={pixelSize}
              className={clsx(
                'transition-colors duration-150',
                filled ? 'text-secondary-500 fill-secondary-500' : 'text-gray-300 fill-gray-100',
              )}
            />
          </button>
        )
      })}
      {showValue && (
        <span className="ml-1 text-sm font-semibold text-gray-700">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}
