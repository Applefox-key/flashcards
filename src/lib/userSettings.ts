/** All language options available for speech/voice features */
export const ALL_SPEECH_LANGS = [
  { code: "ru-RU", label: "RU", name: "Russian" },
  { code: "en-US", label: "EN", name: "English" },
  { code: "uk-UA", label: "UK", name: "Ukrainian" },
  { code: "pl-PL", label: "PL", name: "Polish" },
  { code: "de-DE", label: "DE", name: "German" },
  { code: "fr-FR", label: "FR", name: "French" },
  { code: "es-ES", label: "ES", name: "Spanish" },
  { code: "zh-CN", label: "ZH", name: "Chinese" },
  { code: "ja-JP", label: "JA", name: "Japanese" },
  { code: "",      label: "AU", name: "Auto (browser)" },
] as const;

export type LangCode = (typeof ALL_SPEECH_LANGS)[number]["code"];

/** Shown in SpeakButton / VoiceInputButton when the user hasn't configured anything */
export const DEFAULT_SPEECH_LANGS: LangCode[] = ["en-US", ""];

/** Settings specific to the Flashcards project */
export interface FlashcardsSettings {
  onboarded?: boolean;
  listView?: boolean;
  colorBack?: string;
}

/**
 * Top-level user settings stored in the `settings` JSON column.
 * Global keys (langUI, speechLangs) are shared across all projects.
 * Per-project keys are nested under their project name.
 */
export interface UserSettings {
  langUI?: string;
  speechLangs?: LangCode[];
  flashcards?: FlashcardsSettings;
}

/**
 * Parse the `settings` field returned by the server.
 * The server stores it as a JSON string; sometimes without an opening brace.
 */
export function parseUserSettings(raw: unknown): UserSettings {
  if (!raw) return {};
  if (typeof raw === "object") return raw as UserSettings;
  const str = String(raw).trim();
  const attempts = [str, `{${str}}`];
  for (const s of attempts) {
    try { return JSON.parse(s) as UserSettings; } catch { /* next */ }
  }
  return {};
}

export function serializeSettings(s: UserSettings): string {
  return JSON.stringify(s);
}
