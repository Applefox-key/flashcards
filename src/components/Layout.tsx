import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { Toaster } from "./Toast";
import { useIsDemo } from "@/hooks/useIsDemo";

const APPS = [
  {
    name: "FlashMinds",
    desc: "Collections & flashcards",
    href: "https://flashcards.learnapp.pro",
    current: true,
    iconBg: "#eef2ff",
    iconColor: "#4f46e5",
  },

  {
    name: "Phrasely",
    desc: "90-second method",
    href: "https://phrasely.learnapp.pro",
    current: false,
    iconBg: "#faf5ff",
    iconColor: "#0d9488",
  },
  {
    name: "Tracker",
    desc: "Progress & vocabulary",
    href: "https://tracker.learnapp.pro",
    current: false,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
  },
] as const;

export function Layout() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const navigate = useNavigate();
  const isDemo = useIsDemo();
  const [appsOpen, setAppsOpen] = useState(false);

  useEffect(() => {
    if (!appsOpen) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById("apps-dropdown-root");
      if (el && !el.contains(e.target as Node)) setAppsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [appsOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Demo banner — fixed at top, never scrolls */}
      {isDemo && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between gap-4">
          <p className="text-xs text-amber-700">👋 Demo mode — changes are not saved and will be lost on refresh.</p>
          <div className="flex gap-3">
            <NavLink
              to="/login"
              onClick={logout}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium underline">
              Sign in
            </NavLink>
            <NavLink
              to="/login"
              onClick={logout}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium underline">
              Register
            </NavLink>
          </div>
        </div>
      )}

      {/* Navbar — fixed at top, never scrolls */}
      <header className="shrink-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 z-10">
        <button onClick={toggleSidebar} className="p-2 rounded hover:bg-gray-100" aria-label="Toggle sidebar">
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
              `px-3 py-1.5 rounded text-sm font-medium ${isActive ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`
            }>
            Library
          </NavLink>
          <NavLink
            to="/playlists"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium ${isActive ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`
            }>
            Playlists
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium ${isActive ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`
            }>
            Categories
          </NavLink>
          <NavLink
            to="/tags"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium ${isActive ? "bg-violet-100 text-violet-700" : "text-gray-600 hover:bg-gray-100"}`
            }>
            Tags
          </NavLink>
        </nav>

        {/* Apps switcher — desktop only */}
        <div id="apps-dropdown-root" className="relative hidden sm:block">
          <button
            onClick={() => setAppsOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm border transition-colors ${
              appsOpen
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="5" height="5" rx="1.5" />
              <rect x="10" y="1" width="5" height="5" rx="1.5" />
              <rect x="1" y="10" width="5" height="5" rx="1.5" />
              <rect x="10" y="10" width="5" height="5" rx="1.5" />
            </svg>
            Apps
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ transform: appsOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
              <path d="M2 3l3 3 3-3" />
            </svg>
          </button>

          {appsOpen && (
            <div className="absolute right-0 top-10 z-50 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2.5 px-1">learnapp.pro — all tools</p>
              <div className="grid grid-cols-2 gap-2">
                {APPS.map((app) =>
                  app.current ? (
                    <div
                      key={app.name}
                      className="flex flex-col gap-1 p-2.5 rounded-xl border-2 border-indigo-500 bg-indigo-50 cursor-default">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                        style={{ background: app.iconBg }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <path d="M8 21h8M12 17v4" />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold text-indigo-800">{app.name}</span>
                      <span className="text-xs text-indigo-400 leading-tight">{app.desc}</span>
                      <span className="text-xs bg-indigo-100 text-indigo-600 rounded px-1.5 py-0.5 w-fit mt-0.5">
                        current
                      </span>
                    </div>
                  ) : (
                    <a
                      key={app.name}
                      href={app.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col gap-1 p-2.5 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors no-underline cursor-pointer">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                        style={{ background: app.iconBg }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <path d="M8 21h8M12 17v4" />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold text-gray-800">{app.name}</span>
                      <span className="text-xs text-gray-400 leading-tight">{app.desc}</span>
                    </a>
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto hidden sm:flex items-center gap-3">
          <NavLink to="/profile" className="text-sm text-gray-600 hover:text-gray-900">
            {user?.name}
          </NavLink>
          <NavLink to="/about" className="text-xs text-gray-400 hover:text-gray-600">
            About
          </NavLink>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
            Logout
          </button>
        </div>
      </header>

      {/* Body — fills remaining height, never overflows */}
      <div className="relative flex flex-1 min-h-0">
        {/* Backdrop — mobile only, closes sidebar on tap */}
        {sidebarOpen && <div className="fixed inset-0 z-10 bg-black/20 sm:hidden" onClick={toggleSidebar} />}

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
              {user?.role === "admin" && (
                <NavLink to="/admin" className="text-sm text-gray-700 hover:text-indigo-600 py-1">
                  Admin
                </NavLink>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-red-500 py-1 text-left transition-colors">
                Logout
              </button>

              {/* Other tools — mobile only */}
              <div className="border-t border-gray-100 mt-3 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Other tools</p>
                {APPS.filter((app) => !app.current).map((app) => (
                  <a
                    key={app.name}
                    href={app.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 py-1.5 text-sm text-gray-700 hover:text-indigo-600 transition-colors no-underline">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={{ background: app.iconBg }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill={app.iconColor}>
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                    </div>
                    {app.name}
                  </a>
                ))}
              </div>
            </nav>
          </aside>
        )}

        {/* Main content — only this scrolls */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  );
}
