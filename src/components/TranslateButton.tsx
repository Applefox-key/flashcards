import { useState } from "react";
import { translateText } from "@/lib/translate";
import { ALL_SPEECH_LANGS, type LangCode } from "@/lib/userSettings";
import { useUserSettings } from "@/hooks/useUserSettings";

const FALLBACK_LANG_CODES: LangCode[] = ["en-US", "ru-RU", "uk-UA", "de-DE", "fr-FR"];

interface Props {
  sourceText: string;
  onResult: (text: string) => void;
  onError?: (msg: string) => void;
  className?: string;
}

export function TranslateButton({ sourceText, onResult, onError, className = "" }: Props) {
  const { speechLangs } = useUserSettings();

  const userValidLangs = ALL_SPEECH_LANGS.filter((l) => l.code !== "" && speechLangs.includes(l.code));
  const langOptions = userValidLangs.length >= 2
    ? userValidLangs
    : ALL_SPEECH_LANGS.filter((l) => l.code !== "" && FALLBACK_LANG_CODES.includes(l.code as LangCode));

  const [srcLang, setSrcLang] = useState<LangCode>(langOptions[0]?.code ?? "en-US");
  const [tgtLang, setTgtLang] = useState<LangCode>(
    langOptions.find((l) => l.code !== (langOptions[0]?.code ?? "en-US"))?.code ?? "ru-RU",
  );
  const [loading, setLoading] = useState(false);

  const disabled = loading || !sourceText.trim() || srcLang === tgtLang;

  async function handleTranslate() {
    if (disabled) return;
    setLoading(true);
    try {
      const result = await translateText(sourceText.trim(), tgtLang, srcLang.slice(0, 2));
      onResult(result);
    } catch {
      onError?.("Translation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {langOptions.map(({ code, label }) => (
        <button
          key={`src-${code}`}
          type="button"
          onClick={() => { if (code !== tgtLang) setSrcLang(code); }}
          title={`From ${code}`}
          className={`text-[10px] px-1 py-0.5 rounded transition-colors leading-none ${
            srcLang === code
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-semibold"
              : code === tgtLang
              ? "opacity-30 cursor-not-allowed text-gray-400"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
        >
          {label}
        </button>
      ))}
      <span className="text-[9px] text-gray-300 dark:text-gray-600 px-0.5">→</span>
      {langOptions.map(({ code, label }) => (
        <button
          key={`tgt-${code}`}
          type="button"
          onClick={() => { if (code !== srcLang) setTgtLang(code); }}
          title={`To ${code}`}
          className={`text-[10px] px-1 py-0.5 rounded transition-colors leading-none ${
            tgtLang === code
              ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 font-semibold"
              : code === srcLang
              ? "opacity-30 cursor-not-allowed text-gray-400"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        onClick={handleTranslate}
        disabled={disabled}
        title={`Translate ${srcLang.slice(0, 2).toUpperCase()} → ${tgtLang.slice(0, 2).toUpperCase()}`}
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0 disabled:opacity-30 ${
          loading
            ? "text-violet-500"
            : "text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        {loading ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="animate-spin">
            <path d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8V2z" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
          </svg>
        )}
      </button>
    </div>
  );
}
