import { useState, useEffect } from "react";
import { authApi } from "@/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/useToast";
import { useUserSettings } from "@/hooks/useUserSettings";
import { ALL_SPEECH_LANGS, serializeSettings, type LangCode } from "@/lib/userSettings";
import { Button } from "@/components/Button";
import { getAvatarUrl } from "@/utils";
import { useTranslation } from "react-i18next";

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 select-none">
      {initials || "?"}
    </div>
  );
}

// ── Avatar picker modal ──────────────────────────────────────────────────────
interface AvatarPickerProps {
  currentUrl: string;
  onSelect: (file: File | null, url: string) => void;
  onClose: () => void;
}

function AvatarPicker({ currentUrl, onSelect, onClose }: AvatarPickerProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string>(currentUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleClear() {
    setSelectedFile(null);
    setPreview("");
  }

  function handleSelect() {
    onSelect(selectedFile, preview);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t("profile.avatar_picker_title")}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">
            ×
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-4">
          {preview ? (
            <img
              src={preview}
              alt="preview"
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              {t("profile.avatar_no_image")}
            </div>
          )}
        </div>

        {/* File input */}
        <label className="block mb-4">
          <span className="sr-only">Choose image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 dark:file:border-gray-600 file:text-sm file:bg-white dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-50 dark:hover:file:bg-gray-600 cursor-pointer"
          />
        </label>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleClear}>
            {t("profile.avatar_clear")}
          </Button>
          <Button size="sm" onClick={handleSelect} className="flex-1">
            {t("profile.avatar_use_photo")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const toast = useToast();
  const { user, setUser } = useAuthStore();
  const { settings, speechLangs, flashcardsSettings } = useUserSettings();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedLangs, setSelectedLangs] = useState<LangCode[]>(speechLangs);
  const [onboarded, setOnboarded] = useState(flashcardsSettings.onboarded ?? false);
  const { t } = useTranslation();
  // Sync when settings load from store
  useEffect(() => {
    setSelectedLangs(speechLangs);
  }, [JSON.stringify(speechLangs)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setOnboarded(flashcardsSettings.onboarded ?? false);
  }, [flashcardsSettings.onboarded]);

  const avatarUrl = avatarPreview || getAvatarUrl(user?.img, user?.id);

  // Sync form when user loads (e.g. on page refresh)
  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
  }, [user]);

  function handleAvatarSelect(file: File | null, url: string) {
    setAvatarFile(file);
    setAvatarPreview(url);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      toast.error(t("profile.toast_passwords_mismatch"));
      return;
    }
    if (password && password.length < 6) {
      toast.error(t("profile.toast_password_too_short"));
      return;
    }

    if (selectedLangs.length === 0) {
      toast.error(t("profile.speech_langs_min_error"));
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (avatarFile) fd.append("file", avatarFile);
      fd.append("data[name]", name);
      fd.append("data[email]", email);
      fd.append("data[img]", avatarPreview && !avatarFile ? avatarPreview : (user?.img ?? ""));
      fd.append("data[id]", String(user?.id ?? ""));
      if (password) fd.append("data[password]", password);
      fd.append(
        "data[settings]",
        serializeSettings({
          ...settings,
          speechLangs: selectedLangs,
          flashcards: { ...settings.flashcards, onboarded },
        }),
      );

      let updated = await authApi.updateProfile(fd);
      if (!updated?.id) updated = await authApi.getMe();
      setUser(updated);
      setPassword("");
      setConfirmPassword("");
      setAvatarFile(null);
      setAvatarPreview(getAvatarUrl(updated.img, updated.id));
      toast.success(t("profile.toast_saved"));
    } catch {
      toast.error(t("profile.toast_save_error"));
    } finally {
      setSaving(false);
    }
  }

  function toggleLang(code: LangCode) {
    setSelectedLangs((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  if (!user) return null;

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400";
  console.log(user);
  console.log(avatarFile);

  return (
    <div className="max-w-lg m-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t("profile.title")}</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative cursor-pointer group" onClick={() => setPickerOpen(true)}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 group-hover:border-indigo-400 transition-colors"
              />
            ) : (
              <AvatarPlaceholder name={name || user.name} />
            )}
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-xs font-medium">{t("profile.avatar_change")}</span>
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("profile.subtitle")}</h2>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("profile.name_label")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={t("profile.name_placeholder")}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("profile.email_label")}</label>
            <div className={` text-slate-300 dark:text-slate-600  ${inputClass} `}>{email}</div>
            {/* <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled
              type="email"
              placeholder="you@example.com"
              className={`${inputClass} text-`}
            /> */}
          </div>
        </div>

        {/* Change password */}
        {/* <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Change password</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">Leave blank to keep your current password.</p>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">New password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="New password (min 6 chars)"
              minLength={password ? 6 : undefined}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Confirm new password</label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Repeat new password"
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                confirmPassword && password !== confirmPassword
                  ? "border-red-300 dark:border-red-700 focus:ring-red-300"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
            )}
          </div>
        </div> */}

        {/* Speech languages */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("profile.speech_langs_title")}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {t("profile.speech_langs_desc")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_SPEECH_LANGS.map(({ code, label, name: langName }) => {
              const active = selectedLangs.includes(code);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleLang(code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    active
                      ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300"
                      : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}>
                  <span className="font-semibold text-xs">{label}</span>
                  <span className="text-xs opacity-70">{langName}</span>
                  {active && <span className="text-indigo-400 dark:text-indigo-300 text-xs leading-none">✓</span>}
                </button>
              );
            })}
          </div>
          {selectedLangs.length === 0 && <p className="text-xs text-red-400">{t("profile.speech_langs_min_error")}</p>}
        </div>

        {/* Onboarding */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t("profile.onboarding_section_title")}</h2>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200">{t("profile.onboarding_completed")}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {t("profile.onboarding_desc")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={onboarded}
              onClick={() => setOnboarded((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                onboarded ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-600"
              }`}>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  onboarded ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>

        <Button type="submit" loading={saving}>
          {t("profile.save_btn")}
        </Button>
      </form>

      {pickerOpen && (
        <AvatarPicker currentUrl={avatarUrl} onSelect={handleAvatarSelect} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
