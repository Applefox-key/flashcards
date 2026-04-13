import { useEffect, useRef, useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { ALL_SPEECH_LANGS, type LangCode } from "@/lib/userSettings";

interface Props {
  /** Text to speak */
  text: string;
  className?: string;
}

const supported = typeof window !== "undefined" && "speechSynthesis" in window;

/** Button that reads `text` aloud. Language chips are driven by the user's profile settings. */
export function SpeakButton({ text, className = "" }: Props) {
  const { speechLangs } = useUserSettings();
  const langs = ALL_SPEECH_LANGS.filter((l) => speechLangs.includes(l.code));

  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState<LangCode>(speechLangs[0] ?? "");
  const utRef = useRef<SpeechSynthesisUtterance | null>(null);

  // When the user's lang list changes, reset active lang to the first in the new list
  useEffect(() => {
    setLang(speechLangs[0] ?? "");
  }, [speechLangs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cancel on unmount
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  if (!supported) return null;

  function handleSpeak(e: React.MouseEvent) {
    e.stopPropagation();
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    if (lang) u.lang = lang;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utRef.current = u;
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  }

  function handleLang(e: React.MouseEvent, code: LangCode) {
    e.stopPropagation();
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); }
    setLang(code);
  }

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {langs.map(({ code, label }) => (
        <button
          key={label}
          type="button"
          onClick={(e) => handleLang(e, code)}
          title={code || "auto"}
          className={`text-[10px] px-1 py-0.5 rounded transition-colors leading-none ${
            lang === code
              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-semibold"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
        >
          {label}
        </button>
      ))}

      <button
        type="button"
        onClick={handleSpeak}
        title={speaking ? "Stop" : "Read aloud"}
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0 ${
          speaking
            ? "text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40"
            : "text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
    </div>
  );
}
