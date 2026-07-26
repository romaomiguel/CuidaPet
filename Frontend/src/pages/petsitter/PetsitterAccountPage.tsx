import { useSearchParams } from 'react-router-dom'
import { PetsitterDashboardPage } from '@/pages/petsitter/PetsitterDashboardPage'
import { PetsitterProfilePage } from '@/pages/petsitter/PetsitterProfilePage'
import { ChatPage } from '@/pages/chat/ChatPage'

/**
 * Hub da conta do petsitter — espelha o /conta do tutor. "Agendamentos" é a seção padrão
 * (é o uso diário do petsitter); os sub-tabs de dentro do painel (pendentes/em_progresso/
 * historico) continuam usando o mesmo `?tab=`, sem colidir, porque os valores nunca se repetem
 * entre os dois níveis — qualquer valor que não seja 'perfil'/'mensagens' cai no default.
 */
export function PetsitterAccountPage() {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab')

  if (tab === 'perfil') return <PetsitterProfilePage />
  if (tab === 'mensagens') return <ChatPage />
  return <PetsitterDashboardPage />
}
