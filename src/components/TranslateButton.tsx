import { useState } from "react";
import { translateText } from "@/lib/translate";
import type { LangCode } from "@/lib/userSettings";

interface Props {
  sourceText: string;
  sourceLang: LangCode;
  targetLang: LangCode;
  onResult: (text: string) => void;
  onError?: (msg: string) => void;
  className?: string;
}

export function TranslateButton({ sourceText, sourceLang, targetLang, onResult, onError, className = "" }: Props) {
  const [loading, setLoading] = useState(false);

  const disabled = loading || !sourceText.trim() || !sourceLang || !targetLang || sourceLang === targetLang;

  async function handleTranslate() {
    if (disabled) return;
    setLoading(true);
    try {
      const result = await translateText(sourceText.trim(), targetLang, sourceLang.slice(0, 2));
      onResult(result);
    } catch {
      onError?.("Translation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={disabled}
      title={sourceLang && targetLang && sourceLang !== targetLang ? `Translate ${sourceLang.slice(0, 2).toUpperCase()} → ${targetLang.slice(0, 2).toUpperCase()}` : "Select different languages to translate"}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0 disabled:opacity-30 ${
        loading
          ? "text-violet-500"
          : "text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      } ${className}`}>
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
  );
}
