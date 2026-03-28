import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { Toaster } from "./Toast";
import { useIsDemo } from "@/hooks/useIsDemo";
import { DarkModeToggle } from "./DarkModeToggle";

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

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.learnapp.pro";

function NavAvatar({ name, img, token }: { name: string; img?: string; token: string | null }) {
  const initials =
    name
      .split(" ")
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const avatarUrl = img
    ? img.startsWith("http") || img.startsWith("blob") || img.startsWith("data:")
      ? img
      : `${API_URL}/img/avatars/?img=${encodeURIComponent(img)}&token=${token ?? ""}`
    : "";

  return avatarUrl ? (
    <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300 select-none">
      {initials}
    </div>
  );
}

export function Layout() {
  const { user, token, logout } = useAuthStore();
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
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Demo banner — fixed at top, never scrolls */}
      {isDemo && (
        <div className="shrink-0 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50 px-4 py-1.5 flex items-center justify-between gap-4">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            👋 Demo mode — changes are not saved and will be lost on refresh.
          </p>
          <div className="flex gap-3">
            <NavLink
              to="/login"
              onClick={logout}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium underline">
              Sign in
            </NavLink>
            <NavLink
              to="/login"
              onClick={logout}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium underline">
              Register
            </NavLink>
          </div>
        </div>
      )}

      {/* Navbar — fixed at top, never scrolls */}
      <header className="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="h-14 flex items-center px-4 gap-4">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle sidebar">
              <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300 mb-1" />
              <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300 mb-1" />
              <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300" />
            </button>
            <NavLink to="/library" className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              FlashMinds
            </NavLink>
          </div>
          <nav className="ml-4 hidden sm:flex gap-2">
            <NavLink
              to="/library"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm font-medium ${isActive ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`
              }>
              Library
            </NavLink>
            <NavLink
              to="/playlists"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm font-medium ${isActive ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`
              }>
              Playlists
            </NavLink>
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm font-medium ${isActive ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`
              }>
              Categories
            </NavLink>
            <NavLink
              to="/tags"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm font-medium ${isActive ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`
              }>
              Tags
            </NavLink>
          </nav>

          <NavLink
            to="/about"
            className="hidden sm:inline flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            title="About">
            {" "}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            {/* <span className="text-xs">About</span> */}
          </NavLink>

          <div className="ml-auto flex items-center justify-end gap-3">
            <DarkModeToggle />
            {/* Apps switcher */}
            <div id="apps-dropdown-root" className="relative">
              <button
                onClick={() => setAppsOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm border transition-colors ${
                  appsOpen
                    ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="1" width="5" height="5" rx="1.5" />
                  <rect x="10" y="1" width="5" height="5" rx="1.5" />
                  <rect x="1" y="10" width="5" height="5" rx="1.5" />
                  <rect x="10" y="10" width="5" height="5" rx="1.5" />
                </svg>
                <span className="hidden sm:inline">Apps</span>
                <svg
                  className="hidden sm:block"
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
                <div className="absolute right-0 top-10 z-50 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 px-1">
                    learnapp.pro — all tools
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {APPS.map((app) =>
                      app.current ? (
                        <div
                          key={app.name}
                          className="flex flex-col gap-1 p-2.5 rounded-xl border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 cursor-default">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                            style={{ background: app.iconBg }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <path d="M8 21h8M12 17v4" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">{app.name}</span>
                          <span className="text-xs text-indigo-400 leading-tight">{app.desc}</span>
                          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded px-1.5 py-0.5 w-fit mt-0.5">
                            current
                          </span>
                        </div>
                      ) : (
                        <a
                          key={app.name}
                          href={app.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col gap-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors no-underline cursor-pointer">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                            style={{ background: app.iconBg }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <path d="M8 21h8M12 17v4" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{app.name}</span>
                          <span className="text-xs text-gray-400 leading-tight">{app.desc}</span>
                        </a>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
            <NavLink to="/profile" className="flex items-center hover:opacity-80 transition-opacity">
              {user && <NavAvatar name={user.name} img={user.img} token={token} />}
            </NavLink>{" "}
            <button
              onClick={handleLogout}
              className="hidden sm:inline flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Logout">
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile bottom nav row — hidden on desktop */}
        <nav className="sm:hidden flex px-2">
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `flex-1 text-center py-2 text-xs font-medium ${isActive ? "text-indigo-700 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`
            }>
            Library
          </NavLink>
          <NavLink
            to="/playlists"
            className={({ isActive }) =>
              `flex-1 text-center py-2 text-xs font-medium ${isActive ? "text-indigo-700 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`
            }>
            Playlists
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `flex-1 text-center py-2 text-xs font-medium ${isActive ? "text-indigo-700 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`
            }>
            Categories
          </NavLink>
          <NavLink
            to="/tags"
            className={({ isActive }) =>
              `flex-1 text-center py-2 text-xs font-medium ${isActive ? "text-violet-700 dark:text-violet-400" : "text-gray-500 dark:text-gray-400"}`
            }>
            Tags
          </NavLink>{" "}
          <NavLink
            to="/about"
            className="flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            title="About">
            <svg
              className="sm:hidden"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </NavLink>{" "}
          <button
            onClick={handleLogout}
            className=" ml-4 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            title="Logout">
            <svg
              className="sm:hidden"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </nav>
      </header>

      {/* Body — fills remaining height, never overflows */}
      <div className="relative flex flex-1 min-h-0">
        {/* Backdrop — mobile only, closes sidebar on tap */}
        {sidebarOpen && <div className="fixed inset-0 z-10 bg-black/20 sm:hidden" onClick={toggleSidebar} />}

        {/* Sidebar — overlays on mobile, pushes content on desktop */}
        {sidebarOpen && (
          <aside className="absolute inset-y-0 left-0 z-20 w-64 sm:relative sm:inset-y-auto sm:left-auto sm:z-auto sm:w-56 sm:shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Navigation</p>
            <nav className="flex flex-col gap-1">
              <NavLink
                to="/library"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                My Library
              </NavLink>
              <NavLink
                to="/categories"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                Categories
              </NavLink>
              <NavLink
                to="/tags"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 py-1">
                Tags
              </NavLink>
              <NavLink
                to="/library/public"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                Public Library
              </NavLink>
              <NavLink
                to="/playlists"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                Playlists
              </NavLink>
              <NavLink
                to="/profile"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                Profile
              </NavLink>
              <NavLink
                to="/about"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                About
              </NavLink>
              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                  Admin
                </NavLink>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 py-1 text-left transition-colors">
                Logout
              </button>

              {/* Other tools — mobile only */}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Other tools</p>
                {APPS.filter((app) => !app.current).map((app) => (
                  <a
                    key={app.name}
                    href={app.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors no-underline">
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
