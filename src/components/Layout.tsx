import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { useUserSettings } from "@/hooks/useUserSettings";
import { parseUserSettings } from "@/lib/userSettings";
import { Toaster } from "./Toast";
import { useIsDemo } from "@/hooks/useIsDemo";
import { getAvatarUrl } from "@/utils";
import { DarkModeToggle } from "./DarkModeToggle";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import i18n from "@/i18n";

const UI_LANGS = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "uk", label: "UK" },
  { code: "es", label: "ES" },
  { code: "pl", label: "PL" },
];

const APPS = [
  {
    name: "FlashMinds",
    descKey: "apps.flashminds_desc",
    href: "https://flashcards.learnypie.com",
    current: true,
    iconBg: "#eef2ff",
    iconColor: "#4f46e5",
  },
  {
    name: "Phrasely",
    descKey: "apps.phrasely_desc",
    href: "https://phrasely.learnypie.com",
    current: false,
    iconBg: "#faf5ff",
    iconColor: "#0d9488",
  },
  {
    name: "Tracker",
    descKey: "apps.tracker_desc",
    href: "https://tracker.learnypie.com",
    current: false,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
  },
] as const;

function NavAvatar({ name, img, userId }: { name: string; img?: string; userId?: number }) {
  const initials =
    name
      .split(" ")
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const avatarUrl = getAvatarUrl(img, userId);

  return avatarUrl ? (
    <img key={avatarUrl} src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300 select-none">
      {initials}
    </div>
  );
}

export function Layout() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { settings, saveLangUI } = useUserSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const isDemo = useIsDemo();
  const { t } = useTranslation();

  // Sync UI language from user settings on mount / settings change
  useEffect(() => {
    const parsed = parseUserSettings(user?.settings);
    if (parsed.langUI) {
      localStorage.setItem("fm_lang_ui", parsed.langUI);
      i18n.changeLanguage(parsed.langUI);
    }
  }, [user?.settings]);

  const isGamePage = /^\/play\/[^/]+\/[^/]+/.test(location.pathname);

  const activeSection =
    location.pathname === "/library" ||
    (location.pathname.startsWith("/library/") && location.pathname !== "/library/public") ||
    location.pathname.startsWith("/collections/")
      ? "library"
      : location.pathname === "/library/public"
        ? "public"
        : location.pathname === "/playlists" || location.pathname.startsWith("/playlists/")
          ? "playlists"
          : location.pathname === "/categories" || location.pathname.startsWith("/categories/")
            ? "categories"
            : location.pathname === "/tags"
              ? "tags"
              : null;
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

  const currentLang = settings.langUI ?? i18n.language ?? "en";

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Demo banner — fixed at top, never scrolls */}
      {isDemo && (
        <div className="shrink-0 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50 px-4 py-1.5 flex items-center justify-between gap-4">
          <p className="text-xs text-amber-700 dark:text-amber-400">👋 {t("layout.demo_banner")}</p>
          <div className="flex gap-3">
            <NavLink
              to="/login"
              onClick={logout}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium underline">
              {t("layout.register")}
            </NavLink>
          </div>
        </div>
      )}

      {/* Navbar — hidden on mobile game pages only */}
      <header
        className={`shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30${isGamePage ? " hidden sm:block" : ""}`}>
        <div className="h-14 flex items-center px-4 gap-4 relative">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
            aria-label={t("layout.toggle_sidebar")}>
            <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300" />
          </button>

          {/* Title: centered absolutely on mobile, inline on desktop */}
          <NavLink
            to="/library"
            className="text-lg font-bold text-indigo-600 dark:text-indigo-400 absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0">
            FlashMinds
          </NavLink>

          <nav className="ml-4 hidden sm:flex gap-2">
            <NavLink
              to="/library"
              className={`px-3 py-1.5 rounded text-sm font-medium ${activeSection === "library" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
              {t("nav.library")}
            </NavLink>
            <NavLink
              to="/playlists"
              className={`px-3 py-1.5 rounded text-sm font-medium ${activeSection === "playlists" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
              {t("nav.playlists")}
            </NavLink>
            <NavLink
              to="/categories"
              className={`px-3 py-1.5 rounded text-sm font-medium ${activeSection === "categories" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
              {t("nav.categories")}
            </NavLink>
            <NavLink
              to="/tags"
              className={`px-3 py-1.5 rounded text-sm font-medium ${activeSection === "tags" ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
              {t("nav.tags")}
            </NavLink>
          </nav>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `hidden sm:inline px-3 py-1.5 rounded text-sm font-medium ${isActive ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`
            }
            title={t("nav.about")}>
            <span className="text-xs">{t("nav.about")}</span>
          </NavLink>

          <div className="ml-auto flex items-center justify-end gap-3">
            {/* DarkModeToggle — desktop only */}
            <span className="hidden sm:flex">
              <DarkModeToggle />
            </span>
            {/* Apps switcher — desktop only */}
            <div id="apps-dropdown-root" className="relative hidden sm:block">
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
                <span>{t("layout.apps")}</span>
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
                <div className="absolute right-0 top-10 z-50 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 px-1">
                    {t("layout.apps_suite")}
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
                          <span className="text-xs text-indigo-400 leading-tight">{t(app.descKey)}</span>
                          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded px-1.5 py-0.5 w-fit mt-0.5">
                            {t("layout.current")}
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
                          <span className="text-xs text-gray-400 leading-tight">{t(app.descKey)}</span>
                        </a>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
            <NavLink to="/profile" className="flex items-center hover:opacity-80 transition-opacity">
              {user && <NavAvatar name={user.name} img={user.img} userId={user.id} />}
            </NavLink>
            <button
              onClick={handleLogout}
              className="hidden sm:inline flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title={t("nav.logout")}>
              <span className="text-sm">{t("nav.logout")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Body — fills remaining height, never overflows */}
      <div className="relative flex flex-1 min-h-0">
        {/* Backdrop — mobile only, closes sidebar on tap */}
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/20 sm:hidden" onClick={toggleSidebar} />}

        {/* Sidebar — overlays on mobile, pushes content on desktop */}
        {sidebarOpen && (
          <aside className="absolute inset-y-0 left-0 z-50 w-64 sm:relative sm:inset-y-auto sm:left-auto sm:z-auto sm:w-56 sm:shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{t("layout.navigation")}</p>
            <nav className="flex flex-col gap-1">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">{t("layout.theme")}</span>
                <DarkModeToggle />
              </div>
              {/* Language picker */}
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">UI</span>
                <div className="flex gap-1">
                  {UI_LANGS.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => saveLangUI(lang.code)}
                      className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                        currentLang === lang.code
                          ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}>
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1" />
              <NavLink
                to="/library"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                {t("nav.myLibrary")}
              </NavLink>{" "}
              <NavLink
                to="/library/public"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                {t("nav.publicLibrary")}
              </NavLink>{" "}
              <NavLink
                to="/playlists"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                {t("nav.playlists")}
              </NavLink>
              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1" />
              <NavLink
                to="/categories"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                {t("nav.categories")}
              </NavLink>
              <NavLink
                to="/tags"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 py-1">
                {t("nav.tags")}
              </NavLink>
              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1" />
              <NavLink
                to="/profile"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                {t("nav.profile")}
              </NavLink>
              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                  {t("nav.admin")}
                </NavLink>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 py-1 text-left transition-colors">
                {t("nav.logout")}
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1" />
              <NavLink
                to="/about"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1">
                {t("nav.about")}
              </NavLink>
              {/* Other tools — mobile only */}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{t("layout.other_tools")}</p>
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
        <main className={`flex-1 min-w-0 overflow-y-auto ${isGamePage ? "p-3" : "p-3 pt-0 sm:p-6 pb-20 sm:pb-6"}`}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="h-full">
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom navigation — hidden on game pages */}
      {!isGamePage && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex">
          <NavLink
            to="/library"
            className={`flex-1 text-center py-3 text-md font-medium ${activeSection === "library" ? "text-indigo-700 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`}>
            {t("nav.library")}
          </NavLink>
          <NavLink
            to="/playlists"
            className={`flex-1 text-center py-3 text-md font-medium ${activeSection === "playlists" ? "text-indigo-700 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`}>
            {t("nav.playlists")}
          </NavLink>
          <NavLink
            to="/categories"
            className={`flex-1 text-center py-3 text-md font-medium ${activeSection === "categories" ? "text-indigo-700 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`}>
            {t("nav.categories")}
          </NavLink>
          <NavLink
            to="/library/public"
            className={`flex-1 flex flex-nowrap items-center justify-center py-3 gap-0.5 text-md font-medium ${activeSection === "public" ? "text-indigo-700 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {t("layout.public")}
          </NavLink>
        </nav>
      )}

      <OnboardingWizard />
      <Toaster />
    </div>
  );
}
