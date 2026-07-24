import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { MapPin } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { locationService } from '@/services/location.service'
import { formatDateTime } from '@/utils'

// Vite não resolve os caminhos relativos que o Leaflet usa por padrão pros ícones —
// sem isso, os marcadores ficam sem ícone (só a sombra).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface LocationTrailMapProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
}

export function LocationTrailMap({ isOpen, onClose, bookingId }: LocationTrailMapProps) {
  const { data: checkIns, isLoading } = useQuery({
    queryKey: ['location-checkins', bookingId],
    queryFn: () => locationService.listCheckIns(bookingId),
    enabled: isOpen,
  })

  const points = checkIns ?? []
  const bounds: [number, number][] = points.map(p => [p.latitude, p.longitude])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trajeto do passeio" size="lg">
      <div className="h-[60vh] rounded-xl overflow-hidden bg-gray-50">
        {isLoading && (
          <div className="h-full flex items-center justify-center">
            <Spinner />
          </div>
        )}

        {!isLoading && points.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <MapPin size={32} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              O cuidador ainda não compartilhou localização neste serviço.
            </p>
          </div>
        )}

        {!isLoading && points.length > 0 && (
          <MapContainer bounds={bounds} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map(point => (
              <Marker key={point.id} position={[point.latitude, point.longitude]}>
                <Popup>{formatDateTime(point.createdAt)}</Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </Modal>
  )
}
