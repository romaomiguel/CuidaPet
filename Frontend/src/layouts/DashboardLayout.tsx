import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar }   from '@/components/layout/Sidebar'
import { Navbar }    from '@/components/layout/Navbar'
import type { UserRole } from '@/types'

interface DashboardLayoutProps {
  role: UserRole
}

/**
 * DashboardLayout — full app shell with sidebar + top navbar.
 * On mobile the sidebar collapses to an off-canvas drawer toggled by the Navbar.
 */
export function DashboardLayout({ role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Sidebar ── */}
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Mobile sidebar backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
