import { Link } from 'react-router-dom'
import { MapPin, Star, Clock } from 'lucide-react'
import clsx from 'clsx'
import type { PetsitterProfile } from '@/types'
import { formatCurrency, serviceLabels, avatarUrl } from '@/utils'

interface CardPetsitterProps {
  petsitter: PetsitterProfile
  className?: string
}

export function CardPetsitter({ petsitter, className }: CardPetsitterProps) {
  const { id, user, location, city, state, rating, totalReviews, pricePerHour, services, isAvailable, pricingConfig } = petsitter

  const prices = Object.values(pricingConfig || {}).map(p => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : pricePerHour;
  const isStartingPrice = prices.length > 0;

  return (
    <Link
      to={`/petsitters/${id}`}
      className={clsx(
        'group card p-0 hover:shadow-card-hover',
        'hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col',
        className,
      )}
    >
      {/* ── Photo ── */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-primary-100 to-primary-50 overflow-hidden">
        <img
          src={avatarUrl(user.name, user.avatarUrl ?? undefined)}
          alt={user.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Availability badge */}
        <div className="absolute top-3 left-3">
          <span className={clsx(
            'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-pill backdrop-blur-sm',
            isAvailable
              ? 'bg-emerald-500/90 text-white'
              : 'bg-ink/60 text-white',
          )}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', isAvailable ? 'bg-white' : 'bg-stroke')} />
            {isAvailable ? 'Disponível' : 'Indisponível'}
          </span>
        </div>

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-white/95 backdrop-blur-sm text-ink text-sm font-bold px-2.5 py-1 rounded-pill shadow-sm">
            {isStartingPrice && <span className="text-xs font-normal text-muted mr-1">A partir de</span>}
            {formatCurrency(minPrice)}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Name + location */}
        <div>
          <h3 className="font-heading font-bold text-ink text-base group-hover:text-primary-600 transition-colors truncate">
            {user.name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5 text-sm text-muted">
            <MapPin size={13} className="text-muted flex-shrink-0" />
            <span className="truncate">{location ? `${location}, ${city}` : `${city}, ${state}`}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={13}
                className={clsx(
                  i < Math.round(rating)
                    ? 'text-secondary-500 fill-secondary-500'
                    : 'text-stroke fill-stroke',
                )}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-ink">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted">({totalReviews} avaliações)</span>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-1.5">
          {services.slice(0, 3).map(s => (
            <span key={s} className="badge badge-green text-xs">
              {serviceLabels[s]}
            </span>
          ))}
          {services.length > 3 && (
            <span className="badge badge-gray text-xs">+{services.length - 3}</span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted">
              <Clock size={12} />
              Responde rápido
            </div>
            <span className="text-sm font-bold text-primary-600 group-hover:text-primary-700 flex items-center gap-1">
              Ver perfil →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
