import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import clsx from 'clsx'
import type { PublicPartnerProfile } from '@/types'
import { serviceLabels, avatarUrl } from '@/utils'

interface CardPartnerProps {
  partner: PublicPartnerProfile
  className?: string
}

export function CardPartner({ partner, className }: CardPartnerProps) {
  const { id, type, businessName, address, city, state, servicesOffered, user } = partner

  return (
    <Link
      to={`/parceiros/${id}`}
      className={clsx(
        'group card p-0 hover:shadow-card-hover',
        'hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col',
        className,
      )}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-primary-100 to-primary-50 overflow-hidden">
        <img
          src={avatarUrl(businessName, user.avatarUrl ?? undefined)}
          alt={businessName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className={type === 'clinica' ? 'badge-blue' : 'badge-gray'}>
            {type === 'clinica' ? 'Clínica' : 'Petshop'}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-heading font-bold text-ink text-base group-hover:text-primary-600 transition-colors truncate">
            {businessName}
          </h3>
          <div className="flex items-center gap-1 mt-0.5 text-sm text-muted">
            <MapPin size={13} className="text-muted flex-shrink-0" />
            <span className="truncate">{address ? `${address}, ${city}` : `${city}, ${state}`}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {servicesOffered.slice(0, 3).map((s) => (
            <span key={s} className="badge badge-green text-xs">
              {serviceLabels[s]}
            </span>
          ))}
          {servicesOffered.length > 3 && (
            <span className="badge badge-gray text-xs">+{servicesOffered.length - 3}</span>
          )}
        </div>

        <div className="mt-auto pt-1 text-right">
          <span className="text-sm font-bold text-primary-600 group-hover:text-primary-700">
            Ver perfil →
          </span>
        </div>
      </div>
    </Link>
  )
}
