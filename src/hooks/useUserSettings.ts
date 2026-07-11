import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api";
import i18n from "@/i18n";
import {
  parseUserSettings,
  DEFAULT_SPEECH_LANGS,
  type LangCode,
  type UserSettings,
  type FlashcardsSettings,
} from "@/lib/userSettings";

export function useUserSettings() {
  const { user, setUser } = useAuthStore();
  const settings = parseUserSettings(user?.settings);

  const speechLangs: LangCode[] =
    settings.speechLangs && settings.speechLangs.length > 0
      ? settings.speechLangs
      : DEFAULT_SPEECH_LANGS;

  const flashcardsSettings: FlashcardsSettings = settings.flashcards ?? {};

  async function saveSpeechLangs(langs: LangCode[]): Promise<void> {
    if (!user) return;
    const next: UserSettings = { ...settings, speechLangs: langs };
    setUser({ ...user, settings: next as Record<string, unknown> });
    const updated = await authApi.updateSettings({ speechLangs: langs });
    if (updated) {
      setUser({ ...user, settings: updated as Record<string, unknown> });
    }
  }

  async function saveFlashcardsSettings(patch: Partial<FlashcardsSettings>): Promise<void> {
    if (!user) return;
    const merged: FlashcardsSettings = { ...flashcardsSettings, ...patch };
    const next: UserSettings = { ...settings, flashcards: merged };
    setUser({ ...user, settings: next as Record<string, unknown> });
    const updated = await authApi.updateSettings({ flashcards: merged });
    if (updated) {
      setUser({ ...user, settings: updated as Record<string, unknown> });
    }
  }

  async function saveLangUI(lang: string): Promise<void> {
    if (!user) return;
    localStorage.setItem('fm_lang_ui', lang);
    i18n.changeLanguage(lang);
    const next: UserSettings = { ...settings, langUI: lang };
    setUser({ ...user, settings: next as Record<string, unknown> });
    const updated = await authApi.updateSettings({ langUI: lang });
    if (updated) {
      setUser({ ...user, settings: updated as Record<string, unknown> });
    }
  }

  return { settings, speechLangs, flashcardsSettings, saveSpeechLangs, saveFlashcardsSettings, saveLangUI };
}
