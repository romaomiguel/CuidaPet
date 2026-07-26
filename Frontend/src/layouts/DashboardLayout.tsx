import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar }   from '@/components/layout/Sidebar'
import { Navbar }    from '@/components/layout/Navbar'
import { useAuthStore } from '@/store/auth.store'

/**
 * DashboardLayout — full app shell with sidebar + top navbar.
 * Nav items adapt to the logged-in user's role automatically.
 * On mobile the sidebar collapses to an off-canvas drawer toggled by the Navbar.
 */
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Sidebar ── */}
      <Sidebar
        role={user?.role ?? 'tutor'}
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
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
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
