import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout }    from '@/layouts/PublicLayout'
import { AuthLayout }      from '@/layouts/AuthLayout'
import { ProtectedRoute }  from '@/components/auth/ProtectedRoute'

import { LandingPage }           from '@/pages/public/LandingPage'
import { SearchPage }            from '@/pages/public/SearchPage'
import { PetsitterDetailPage }   from '@/pages/public/PetsitterDetailPage'
import { HelpPage }              from '@/pages/public/HelpPage'
import { NotFoundPage }          from '@/pages/public/NotFoundPage'
import { LoginPage }             from '@/pages/auth/LoginPage'
import { RegisterPage }          from '@/pages/auth/RegisterPage'
import { AccountPage }           from '@/pages/account/AccountPage'
import { BookingsPage }          from '@/pages/account/BookingsPage'
import { PetsPage }              from '@/pages/account/PetsPage'
import { ChatPage }              from '@/pages/chat/ChatPage'
import { MatchWizard }           from '@/pages/tutor/MatchWizard'
import { MatchResults }          from '@/pages/tutor/MatchResults'
import { PetsitterDashboardPage }  from '@/pages/petsitter/PetsitterDashboardPage'
import { PetsitterProfilePage }    from '@/pages/petsitter/PetsitterProfilePage'
import { AdminDashboardPage }      from '@/pages/admin/AdminDashboardPage'
import { AdminUsersPage }          from '@/pages/admin/AdminUsersPage'
import { AdminPetsittersPage }     from '@/pages/admin/AdminPetsittersPage'
import { DashboardLayout }         from '@/layouts/DashboardLayout'

export default function App() {
  return (
    <Routes>
      {/* ── Marketplace público + área logada ── */}
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/buscar"           element={<SearchPage />} />
        <Route path="/petsitters/:id"   element={<PetsitterDetailPage />} />
        <Route path="/ajuda"            element={<HelpPage />} />

        {/* Área logada – qualquer role */}
        <Route path="/conta" element={
          <ProtectedRoute><AccountPage /></ProtectedRoute>
        } />
        {/* Área logada – somente tutor */}
        <Route path="/agendamentos" element={
          <ProtectedRoute allowedRoles={['tutor']}><BookingsPage /></ProtectedRoute>
        } />
        <Route path="/pets" element={
          <ProtectedRoute allowedRoles={['tutor']}><PetsPage /></ProtectedRoute>
        } />
        {/* Área logada – tutor e petsitter (conversa é do booking dos dois, admin não tem) */}
        <Route path="/mensagens" element={
          <ProtectedRoute allowedRoles={['tutor', 'petsitter']}><ChatPage /></ProtectedRoute>
        } />
        <Route path="/match"            element={<MatchWizard />} />
        <Route path="/match/resultados" element={<MatchResults />} />

        {/* Área logada – somente petsitter */}
        <Route path="/dashboard/petsitter" element={
          <ProtectedRoute allowedRoles={['petsitter']}><PetsitterDashboardPage /></ProtectedRoute>
        } />
        <Route path="/dashboard/petsitter/perfil" element={
          <ProtectedRoute allowedRoles={['petsitter']}><PetsitterProfilePage /></ProtectedRoute>
        } />
        <Route path="/dashboard/petsitter/agendamentos" element={
          <Navigate to="/dashboard/petsitter?tab=agendamentos" replace />
        } />
      </Route>

      {/* ── Auth ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
      </Route>

      {/* ── Admin Dashboard ── */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout role="admin" />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="petsitters" element={<AdminPetsittersPage />} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/404"       element={<NotFoundPage />} />
      <Route path="*"          element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
