import { useEffect, useRef, useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { ALL_SPEECH_LANGS, type LangCode } from "@/lib/userSettings";

interface Props {
  onResult: (text: string) => void;
  onLangChange?: (lang: LangCode) => void;
  defaultLang?: LangCode;
  speakText?: string;
  className?: string;
}

// Minimal type shim — lib.dom.d.ts may not include SpeechRecognition in all TS configs
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
interface ISpeechRecognitionEvent {
  results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } };
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null) as SpeechRecognitionCtor | null;
}

const supported = !!getSpeechRecognition();
const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

export function VoiceInputButton({ onResult, onLangChange, defaultLang, speakText, className = "" }: Props) {
  const { speechLangs } = useUserSettings();
  const langs = ALL_SPEECH_LANGS.filter((l) => speechLangs.includes(l.code));

  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState<LangCode>(defaultLang ?? speechLangs[0] ?? "");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const utRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setLang(speechLangs[0] ?? "");
  }, [speechLangs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    },
    [],
  );

  if (!supported) return null;

  function start() {
    const API = getSpeechRecognition()!;
    const r = new API();
    r.continuous = true;
    r.interimResults = true;
    if (lang) r.lang = lang;

    r.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      onResult(final || interim);
    };

    r.onend = () => setRecording(false);
    r.onerror = () => setRecording(false);
    recognitionRef.current = r;
    r.start();
    setRecording(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  function handleMicClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (recording) stop();
    else start();
  }

  function handleSpeakClick(e: React.MouseEvent) {
    e.stopPropagation();
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    if (!speakText?.trim()) return;
    const u = new SpeechSynthesisUtterance(speakText.trim());
    if (lang) u.lang = lang;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utRef.current = u;
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  }

  function handleLangClick(e: React.MouseEvent, code: LangCode) {
    e.stopPropagation();
    if (recording) stop();
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
    setLang(code);
    onLangChange?.(code);
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 border border-dashed border-gray-300 dark:border-gray-600 rounded ${className}`}>
      {langs.map(({ code, label }) => (
        <button
          key={label}
          type="button"
          onClick={(e) => handleLangClick(e, code)}
          title={code || "auto"}
          className={`text-[10px] px-1 py-0.5 rounded transition-colors leading-none ${
            lang === code
              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-semibold"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          }`}>
          {label}
        </button>
      ))}

      {speakText !== undefined && ttsSupported && (
        <button
          type="button"
          onClick={handleSpeakClick}
          disabled={!speakText.trim()}
          title={speaking ? "Stop" : "Read aloud"}
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0 disabled:opacity-30 ${
            speaking
              ? "text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40"
              : "text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
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
      )}

      <button
        type="button"
        onClick={handleMicClick}
        title={recording ? "Stop recording" : "Voice input"}
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0 ${
          recording
            ? "text-white bg-red-500 animate-pulse shadow-sm"
            : "text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}>
        {recording ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3 3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
