import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api";
import {
  parseUserSettings,
  serializeSettings,
  DEFAULT_SPEECH_LANGS,
  type LangCode,
  type UserSettings,
} from "@/lib/userSettings";

export function useUserSettings() {
  const { user, setUser } = useAuthStore();
  const settings = parseUserSettings(user?.settings);

  const speechLangs: LangCode[] =
    settings.speechLangs && settings.speechLangs.length > 0
      ? settings.speechLangs
      : DEFAULT_SPEECH_LANGS;

  async function saveSpeechLangs(langs: LangCode[]): Promise<void> {
    if (!user) return;
    const next: UserSettings = { ...settings, speechLangs: langs };

    // Optimistic update — components see new langs immediately
    setUser({ ...user, settings: next as Record<string, unknown> });

    // Persist to server; include all required user fields so the response
    // is a complete user object (preventing partial overwrites in the store)
    const fd = new FormData();
    fd.append("data[id]",       String(user.id));
    fd.append("data[name]",     user.name);
    fd.append("data[email]",    user.email);
    fd.append("data[img]",      user.img ?? "");
    fd.append("data[settings]", serializeSettings(next));

    const updated = await authApi.updateProfile(fd);

    // Only replace store value if we got a complete user back from the server
    if (updated?.id && updated?.name) {
      setUser(updated);
    }
  }

  return { settings, speechLangs, saveSpeechLangs };
}
