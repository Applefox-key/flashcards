import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { Toaster } from './Toast'
import { useIsDemo } from '@/hooks/useIsDemo'

export function Layout() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const navigate = useNavigate()
  const isDemo = useIsDemo()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* Demo banner — fixed at top, never scrolls */}
      {isDemo && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between gap-4">
          <p className="text-xs text-amber-700">
            👋 Demo mode — changes are not saved and will be lost on refresh.
          </p>
          <div className="flex gap-3">
            <NavLink
              to="/login"
              onClick={logout}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium underline"
            >
              Sign in
            </NavLink>
            <NavLink
              to="/login"
              onClick={logout}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium underline"
            >
              Register
            </NavLink>
          </div>
        </div>
      )}

      {/* Navbar — fixed at top, never scrolls */}
      <header className="shrink-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 z-10">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-gray-100"
          aria-label="Toggle sidebar"
        >
          <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
          <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
          <span className="block w-5 h-0.5 bg-gray-600" />
        </button>
        <NavLink to="/library" className="text-lg font-bold text-indigo-600">
          FlashMinds
        </NavLink>
        <nav className="ml-4 hidden sm:flex gap-2">
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            Library
          </NavLink>
          <NavLink
            to="/playlists"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            Playlists
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            Categories
          </NavLink>
          <NavLink
            to="/tags"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium ${isActive ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            Tags
          </NavLink>
        </nav>
        <div className="ml-auto hidden sm:flex items-center gap-3">
          <NavLink
            to="/profile"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {user?.name}
          </NavLink>
          <NavLink to="/about" className="text-xs text-gray-400 hover:text-gray-600">
            About
          </NavLink>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Body — fills remaining height, never overflows */}
      <div className="relative flex flex-1 min-h-0">

        {/* Backdrop — mobile only, closes sidebar on tap */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/20 sm:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar — overlays on mobile, pushes content on desktop */}
        {sidebarOpen && (
          <aside className="absolute inset-y-0 left-0 z-20 w-64 sm:relative sm:inset-y-auto sm:left-auto sm:z-auto sm:w-56 sm:shrink-0 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Navigation</p>
            <nav className="flex flex-col gap-1">
              <NavLink to="/library" className="text-sm text-gray-700 hover:text-indigo-600 py-1">
                My Library
              </NavLink>
              <NavLink to="/categories" className="text-sm text-gray-700 hover:text-indigo-600 py-1">
                Categories
              </NavLink>
              <NavLink to="/tags" className="text-sm text-gray-700 hover:text-violet-600 py-1">
                Tags
              </NavLink>
              <NavLink to="/library/public" className="text-sm text-gray-700 hover:text-indigo-600 py-1">
                Public Library
              </NavLink>
              <NavLink to="/playlists" className="text-sm text-gray-700 hover:text-indigo-600 py-1">
                Playlists
              </NavLink>
              <NavLink to="/profile" className="text-sm text-gray-700 hover:text-indigo-600 py-1">
                Profile
              </NavLink>
              <NavLink to="/about" className="text-sm text-gray-700 hover:text-indigo-600 py-1">
                About
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin" className="text-sm text-gray-700 hover:text-indigo-600 py-1">
                  Admin
                </NavLink>
              )}
              <button onClick={handleLogout} className="text-sm text-gray-700 hover:text-red-500 py-1 text-left transition-colors">
                Logout
              </button>
            </nav>
          </aside>
        )}

        {/* Main content — only this scrolls */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>

      <Toaster />
    </div>
  )
}
