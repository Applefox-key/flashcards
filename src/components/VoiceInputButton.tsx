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
  const [open, setOpen] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const utRef = useRef<SpeechSynthesisUtterance | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

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

  function startRecording() {
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

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  function handleMicClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (recording) stopRecording();
    else startRecording();
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

  function handleLangSelect(e: React.MouseEvent, code: LangCode) {
    e.stopPropagation();
    if (recording) stopRecording();
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
    setLang(code);
    onLangChange?.(code);
    setOpen(false);
  }

  const showSpeak = speakText !== undefined && ttsSupported;

  return (
    <div ref={rootRef} className={`relative inline-flex items-center gap-1 ${className}`}>
      {/* Speak button — standalone small icon, shown only when speakText is provided */}
      {showSpeak && (
        <button
          type="button"
          onClick={handleSpeakClick}
          disabled={!speakText.trim()}
          title={speaking ? "Stop" : "Read aloud"}
          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-colors shrink-0 disabled:opacity-30 ${
            speaking
              ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700"
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
      )}

      {/* Mic split button: [🎤 | EN ▼] */}
      <div
        className={`inline-flex items-center rounded-lg border transition-colors overflow-hidden ${
          recording
            ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        }`}
      >
        {/* Mic icon */}
        <button
          type="button"
          onClick={handleMicClick}
          title={recording ? "Stop recording" : "Voice input"}
          className={`inline-flex items-center justify-center w-7 h-7 transition-colors shrink-0 ${
            recording
              ? "text-red-500 dark:text-red-400 animate-pulse"
              : "text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
          }`}
        >
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

        {/* Divider */}
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 shrink-0" />

        {/* Language selector trigger */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          className={`inline-flex items-center gap-0.5 px-1.5 h-7 text-xs font-medium transition-colors shrink-0 ${
            recording
              ? "text-red-500 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
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
