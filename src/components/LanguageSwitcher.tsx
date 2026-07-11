import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "uk", label: "Українська" },
  { code: "es", label: "Español" },
  { code: "pl", label: "Polski" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const lang = e.target.value;
    localStorage.setItem("fm_lang_ui", lang);
    i18n.changeLanguage(lang);
  }

  return (
    <select
      value={i18n.language}
      onChange={handleChange}
      className="text-sm bg-transparent text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 hover:border-gray-400 dark:hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code} className="bg-white dark:bg-gray-800">
          {lang.label}
        </option>
      ))}
    </select>
  );
}
