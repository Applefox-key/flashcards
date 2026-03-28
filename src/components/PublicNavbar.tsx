import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
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

export function PublicNavbar() {
  const [appsOpen, setAppsOpen] = useState(false);

  useEffect(() => {
    if (!appsOpen) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById("pub-apps-dropdown");
      if (el && !el.contains(e.target as Node)) setAppsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [appsOpen]);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
      {/* Main row */}
      <div className="h-14 flex items-center px-4 gap-3">
        {/* Logo */}
        <Link to="/" className="text-lg font-bold text-indigo-600 dark:text-indigo-400 shrink-0 mr-2">
          FlashMinds
        </Link>

        {/* About — centered on desktop */}
        <div className="flex-1 hidden sm:flex justify-center">
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`
            }>
            About
          </NavLink>
        </div>

        {/* Right controls */}
        <div className="ml-auto sm:ml-0 flex items-center gap-2">
          <DarkModeToggle />

          {/* Apps switcher */}
          <div id="pub-apps-dropdown" className="relative">
            <button
              onClick={() => setAppsOpen((v) => !v)}
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

          {/* Login + Register — desktop */}
          <Link
            to="/login"
            className="hidden sm:inline text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1.5 rounded transition-colors">
            Login
          </Link>
          <Link
            to="/login"
            state={{ tab: "register" }}
            className="hidden sm:inline text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors">
            Register
          </Link>

          {/* Mobile: single Login button */}
          <Link
            to="/login"
            className="sm:hidden text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors">
            Login
          </Link>
        </div>
      </div>

      {/* Row 2 — mobile only: About link */}
      <div className="sm:hidden border-gray-100 dark:border-gray-700 px-4 pb-2">
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `text-sm font-medium transition-colors ${
              isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300"
            }`
          }>
          About
        </NavLink>
      </div>
    </header>
  );
}
