import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout }    from '@/layouts/PublicLayout'
import { AuthLayout }      from '@/layouts/AuthLayout'
import { ProtectedRoute }  from '@/components/auth/ProtectedRoute'
import { useAuthStore }    from '@/store/auth.store'

import { LandingPage }           from '@/pages/public/LandingPage'
import { SearchPage }            from '@/pages/public/SearchPage'
import { PetsitterDetailPage }   from '@/pages/public/PetsitterDetailPage'
import { PartnerDetailPage }     from '@/pages/public/PartnerDetailPage'
import { HelpPage }              from '@/pages/public/HelpPage'
import { HelpCategoryPage }      from '@/pages/public/HelpCategoryPage'
import { HelpArticlePage }       from '@/pages/public/HelpArticlePage'
import { HelpSearchResultsPage } from '@/pages/public/HelpSearchResultsPage'
import { NotFoundPage }          from '@/pages/public/NotFoundPage'
import { LoginPage }             from '@/pages/auth/LoginPage'
import { RegisterPage }          from '@/pages/auth/RegisterPage'
import { AccountPage }           from '@/pages/account/AccountPage'
import { MatchWizard }           from '@/pages/tutor/MatchWizard'
import { MatchResults }          from '@/pages/tutor/MatchResults'
import { PetsitterAccountPage }    from '@/pages/petsitter/PetsitterAccountPage'
import { PartnerAccountPage }      from '@/pages/partner/PartnerAccountPage'
import { AdminDashboardPage }      from '@/pages/admin/AdminDashboardPage'
import { AdminUsersPage }          from '@/pages/admin/AdminUsersPage'
import { AdminPetsittersPage }     from '@/pages/admin/AdminPetsittersPage'
import { AdminPartnersPage }        from '@/pages/admin/AdminPartnersPage'
import { AdminSupportMessagesPage } from '@/pages/admin/AdminSupportMessagesPage'
import { AdminServiceSuggestionsPage } from '@/pages/admin/AdminServiceSuggestionsPage'
import { AdminServicesPage } from '@/pages/admin/AdminServicesPage'
import { DashboardLayout }         from '@/layouts/DashboardLayout'

// Tutor e petsitter têm "Mensagens" embutido como aba dentro do respectivo hub de conta.
function MessagesRoute() {
  const { user } = useAuthStore()
  const hub = user?.role === 'petsitter' ? '/dashboard/petsitter' : '/conta'
  return <Navigate to={`${hub}?tab=mensagens`} replace />
}

export default function App() {
  return (
    <Routes>
      {/* ── Marketplace público + área logada ── */}
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/buscar"           element={<SearchPage />} />
        <Route path="/petsitters/:id"   element={<PetsitterDetailPage />} />
        <Route path="/parceiros/:id"    element={<PartnerDetailPage />} />
        <Route path="/ajuda"                  element={<HelpPage />} />
        <Route path="/ajuda/busca"            element={<HelpSearchResultsPage />} />
        <Route path="/ajuda/:categoria"       element={<HelpCategoryPage />} />
        <Route path="/ajuda/:categoria/:slug" element={<HelpArticlePage />} />

        {/* Área logada – tutor e petsitter (conversa é do booking dos dois, admin não tem) */}
        <Route path="/mensagens" element={
          <ProtectedRoute allowedRoles={['tutor', 'petsitter']}><MessagesRoute /></ProtectedRoute>
        } />
        <Route path="/match"            element={<MatchWizard />} />
        <Route path="/match/resultados" element={<MatchResults />} />
      </Route>

      {/* ── Auth ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
      </Route>

      {/* ── Área logada com sidebar + navbar (tutor e petsitter) ── */}
      <Route element={
        <ProtectedRoute><DashboardLayout /></ProtectedRoute>
      }>
        <Route path="/conta"        element={<AccountPage />} />
        {/* Pets/Agendamentos agora são abas dentro de /conta — redirects mantêm links/favoritos antigos funcionando */}
        <Route path="/pets" element={
          <ProtectedRoute allowedRoles={['tutor']}><Navigate to="/conta?tab=pets" replace /></ProtectedRoute>
        } />
        <Route path="/agendamentos" element={
          <ProtectedRoute allowedRoles={['tutor']}><Navigate to="/conta?tab=agendamentos" replace /></ProtectedRoute>
        } />

        {/* Área do Petsitter — mesmo hub, "Agendamentos" é a seção padrão */}
        <Route path="/dashboard/petsitter" element={
          <ProtectedRoute allowedRoles={['petsitter']}><PetsitterAccountPage /></ProtectedRoute>
        } />
        {/* Rotas antigas — redirects mantêm links/favoritos funcionando */}
        <Route path="/dashboard/petsitter/perfil" element={
          <ProtectedRoute allowedRoles={['petsitter']}><Navigate to="/dashboard/petsitter?tab=perfil" replace /></ProtectedRoute>
        } />
        <Route path="/dashboard/petsitter/agendamentos" element={
          <ProtectedRoute allowedRoles={['petsitter']}><Navigate to="/dashboard/petsitter?tab=pendentes" replace /></ProtectedRoute>
        } />

        {/* Área do Parceiro (Clínica/Petshop) */}
        <Route path="/dashboard/partner" element={
          <ProtectedRoute allowedRoles={['partner']}><PartnerAccountPage /></ProtectedRoute>
        } />
      </Route>

      {/* ── Admin Dashboard ── */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="petsitters" element={<AdminPetsittersPage />} />
        <Route path="partners"   element={<AdminPartnersPage />} />
        <Route path="servicos" element={<AdminServicesPage />} />
        <Route path="sugestoes-servico" element={<AdminServiceSuggestionsPage />} />
        <Route path="suporte" element={<AdminSupportMessagesPage />} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/404"       element={<NotFoundPage />} />
      <Route path="*"          element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
