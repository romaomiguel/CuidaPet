import clsx from 'clsx'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={clsx(
        'rounded-full border-gray-200 border-t-primary-500 animate-spin',
        sizeMap[size],
        className,
      )}
    />
  )
}
