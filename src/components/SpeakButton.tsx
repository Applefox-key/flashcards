import { useEffect, useRef, useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { ALL_SPEECH_LANGS, type LangCode } from "@/lib/userSettings";

interface Props {
  text: string;
  className?: string;
}

const supported = typeof window !== "undefined" && "speechSynthesis" in window;

export function SpeakButton({ text, className = "" }: Props) {
  const { speechLangs } = useUserSettings();
  const langs = ALL_SPEECH_LANGS.filter((l) => speechLangs.includes(l.code));

  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState<LangCode>(speechLangs[0] ?? "");
  const [open, setOpen] = useState(false);
  const utRef = useRef<SpeechSynthesisUtterance | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLang(speechLangs[0] ?? "");
  }, [speechLangs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  if (!supported) return null;

  const activeLang = langs.find((l) => l.code === lang);
  const displayLabel = activeLang?.label ?? (lang ? lang.slice(0, 2).toUpperCase() : "—");

  function handleSpeak(e: React.MouseEvent) {
    e.stopPropagation();
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    if (!text.trim()) return;
    const u = new SpeechSynthesisUtterance(text);
    if (lang) u.lang = lang;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utRef.current = u;
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  }

  function handleLangSelect(e: React.MouseEvent, code: LangCode) {
    e.stopPropagation();
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
    setLang(code);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <div
        className={`inline-flex items-center rounded-lg border transition-colors overflow-hidden ${
          speaking
            ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        }`}
      >
        {/* Speaker icon */}
        <button
          type="button"
          onClick={handleSpeak}
          disabled={!text.trim()}
          title={speaking ? "Stop" : "Read aloud"}
          className={`inline-flex items-center justify-center w-7 h-7 transition-colors shrink-0 disabled:opacity-30 ${
            speaking
              ? "text-indigo-600 dark:text-indigo-300"
              : "text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
        >
          {speaking ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1.5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 shrink-0" />

        {/* Language selector trigger */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          className={`inline-flex items-center gap-0.5 px-1.5 h-7 text-xs font-medium transition-colors shrink-0 ${
            speaking
              ? "text-indigo-600 dark:text-indigo-300"
              : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
        >
          {displayLabel}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {open && langs.length > 0 && (
        <div className="absolute top-full mt-1 right-0 z-50 min-w-[72px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md py-1 overflow-hidden">
          {langs.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={(e) => handleLangSelect(e, code)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                lang === code
                  ? "text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
