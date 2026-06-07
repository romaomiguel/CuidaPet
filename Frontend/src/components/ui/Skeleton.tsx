import clsx from 'clsx'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={clsx('skeleton', className)} />
}

export function SkeletonCard() {
  return (
    <div className="card">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      <div className="mt-4 flex justify-between items-center">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonPetsitterCard() {
  return (
    <div className="card space-y-4">
      <Skeleton className="w-full h-48 rounded-xl" />
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonPetCard() {
  return (
    <div className="card flex items-center gap-4">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonBookingCard() {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  )
}

interface SkeletonListProps {
  count?: number
  component?: 'card' | 'petsitter' | 'pet' | 'booking'
}

export function SkeletonList({ count = 3, component = 'card' }: SkeletonListProps) {
  const Map = {
    card: SkeletonCard,
    petsitter: SkeletonPetsitterCard,
    pet: SkeletonPetCard,
    booking: SkeletonBookingCard,
  }
  const Component = Map[component]
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} />
      ))}
    </div>
  )
}
