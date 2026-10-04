import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TbCards, TbListCheck, TbPencil, TbArrowsLeftRight, TbClock, TbPuzzle } from "react-icons/tb";
import type { IconType } from "react-icons";
import { useAuthStore } from "@/store/authStore";

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-700",
    icon: "text-indigo-500 dark:text-indigo-400",
    text: "text-indigo-700 dark:text-indigo-400",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-700",
    icon: "text-green-500 dark:text-green-400",
    text: "text-green-700 dark:text-green-400",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    icon: "text-blue-500 dark:text-blue-400",
    text: "text-blue-700 dark:text-blue-400",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-700",
    icon: "text-purple-500 dark:text-purple-400",
    text: "text-purple-700 dark:text-purple-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-700",
    icon: "text-amber-500 dark:text-amber-400",
    text: "text-amber-700 dark:text-amber-400",
  },
  coral: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-700",
    icon: "text-orange-500 dark:text-orange-400",
    text: "text-orange-700 dark:text-orange-400",
  },
};

export function AboutPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isDemo } = useAuthStore();
  const navigate = useNavigate();

  const ACTIVITIES: { Icon: IconType; color: string; type: string }[] = [
    { Icon: TbCards, color: "indigo", type: "flashcard" },
    { Icon: TbListCheck, color: "green", type: "test" },
    { Icon: TbPencil, color: "blue", type: "write" },
    { Icon: TbArrowsLeftRight, color: "purple", type: "pairs" },
    { Icon: TbClock, color: "amber", type: "timed" },
    { Icon: TbPuzzle, color: "coral", type: "parts" },
  ];

  const FEATURES = [
    t("about.feature_organize"),
    t("about.feature_images"),
    t("about.feature_import"),
    t("about.feature_share"),
    t("about.feature_copy"),
    t("about.feature_playlists"),
    t("about.feature_ratings"),
    t("about.feature_filter"),
  ];

  function handleDemo() {
    useAuthStore.getState().enterDemo();
    navigate("/library");
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 flex flex-col gap-6 sm:gap-10 py-8 sm:py-12">
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-600">FlashMinds</h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            {t("about.hero_subtitle")}
          </p>
        </div>

        {/* What is this */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t("about.what_title")}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {t("about.what_desc")}
          </p>
        </div>

        {/* Activities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t("about.activities_title")}</h2>
            {!isAuthenticated && !isDemo && (
              <button
                onClick={handleDemo}
                className="text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors px-3 py-1 rounded-full font-medium">
                {t("about.try_demo")}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACTIVITIES.map((a) => {
              const c = COLOR_MAP[a.color];
              return (
                <div
                  key={a.type}
                  className={`${c.bg} ${c.border} border rounded-xl p-4`}>
                  <a.Icon size={24} className={`${c.icon} mb-2`} />
                  <div className={`text-sm font-semibold ${c.text}`}>{t(`game_hub.activities.${a.type}.label`)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(`game_hub.activities.${a.type}.desc`)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t("about.features_title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEATURES.map((f) => (
              <div key={f} className="flex gap-2">
                <span className="text-indigo-500 shrink-0">✓</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA for unauthenticated users */}
        {!isAuthenticated && !isDemo && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-5 flex flex-col items-center text-center gap-3">
            <p className="text-base font-semibold text-indigo-700 dark:text-indigo-300">{t("about.cta_title")}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("about.cta_desc")}</p>
            <Link
              to="/login"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
              {t("about.cta_signin")}
            </Link>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center pb-4">
          {t("about.footer")}
        </p>
    </div>
  );
}
