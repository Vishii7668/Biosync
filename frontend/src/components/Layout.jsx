import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, PlusCircle, TrendingUp, ShieldAlert, LogOut, Activity } from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/log', icon: PlusCircle, label: 'Log Today' },
  { to: '/trends', icon: TrendingUp, label: 'Trends & Forecast' },
  { to: '/risk', icon: ShieldAlert, label: 'Risk Report' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col glass border-r border-white/5 px-4 py-6 fixed h-full z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">BioSync</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-400 font-medium'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  )
}
