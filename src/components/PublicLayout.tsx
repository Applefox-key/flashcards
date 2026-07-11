import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DarkModeToggle } from "./DarkModeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function PublicLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30">
        <div className="h-14 flex items-center px-4 gap-4">
          <NavLink to="/" className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            FlashMinds
          </NavLink>

          <div className="ml-auto flex items-center gap-3">
            <DarkModeToggle />
            <LanguageSwitcher />
            <NavLink
              to="/login"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
              {t("layout.sign_in")}
            </NavLink>
            <NavLink
              to="/login"
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
              {t("layout.register")}
            </NavLink>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
