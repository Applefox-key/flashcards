import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { authApi } from "@/api";
import { useLogin, useRegister } from "./hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { PublicNavbar } from "@/components/PublicNavbar";
import { GoogleAuthButton } from "./GoogleAuthButton";
type AuthTab = "login" | "register" | "forgot";

const INPUT_CLS =
  "border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Divider() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <span className="text-xs text-gray-400 dark:text-gray-500">{t("auth.or")}</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

// ── Forgot password form ─────────────────────────────────────────────────────

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await authApi.sendResetEmail(email);
      setSent(true);
    } catch {
      setError(t("auth.forgot_error"));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="text-green-600 text-3xl">✉</div>
        <p className="font-semibold text-gray-800 dark:text-gray-200">{t("auth.check_email_title")}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("auth.check_email_desc")} <strong>{email}</strong>.
        </p>
        <button onClick={onBack} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2">
          {t("auth.back_to_login")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
        {t("auth.forgot_desc")}
      </p>
      <input
        value={email}
        onChange={(e) => {
          setError("");
          setEmail(e.target.value);
        }}
        type="email"
        placeholder={t("auth.email_placeholder")}
        required
        className={INPUT_CLS}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={sending} disabled={!email}>
        {t("auth.send_reset_btn")}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-center">
        {t("auth.back_to_login")}
      </button>
    </form>
  );
}

// ── Main auth page ───────────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const TAB_KEYS = ["login", "register"] as const;

export function AuthPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuthStore();
  const initialTab: AuthTab = (location.state as { tab?: AuthTab } | null)?.tab ?? "login";
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegisterPwd, setShowRegisterPwd] = useState(false);
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  if (user) return <Navigate to="/library" replace />;

  function handleDemoLogin() {
    useAuthStore.getState().enterDemo();
    navigate("/library");
  }

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    loginMutation.mutate(
      {
        email: fd.get("email") as string,
        password: fd.get("password") as string,
      },
      { onSuccess: () => navigate("/library") },
    );
  };
  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    registerMutation.mutate(
      {
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        password: fd.get("password") as string,
      },
      { onSuccess: () => navigate("/library") },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-sm p-8">
          <h1 className="text-2xl font-bold text-center text-indigo-600 mb-2">FlashMinds</h1>
          <div className="text-center mb-6">
            <button
              onClick={handleDemoLogin}
              className="text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors px-4 py-1.5 rounded-full font-medium">
              {t("auth.try_demo")}
            </button>
          </div>

          {/* Tabs (only for login/register) */}
          {tab !== "forgot" && (
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              {TAB_KEYS.map((tabId) => (
                <button
                  key={tabId}
                  onClick={() => setTab(tabId)}
                  className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                    tab === tabId
                      ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}>
                  {t(`auth.tab_${tabId}`)}
                </button>
              ))}
            </div>
          )}

          {/* Forgot password header */}
          {tab === "forgot" && (
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 text-center mb-6">
              {t("auth.forgot_title")}
            </h2>
          )}

          {/* Login form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input name="email" type="email" placeholder={t("auth.email_placeholder")} required className={INPUT_CLS} />
              <div className="relative">
                <input name="password" type={showLoginPwd ? "text" : "password"} placeholder={t("auth.password_placeholder")} required className={INPUT_CLS + " w-full pr-9"} />
                <button type="button" onClick={() => setShowLoginPwd((v) => !v)} className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <EyeIcon visible={showLoginPwd} />
                </button>
              </div>
              {loginMutation.isError && <p className="text-sm text-red-600">{t("auth.login_error")}</p>}
              <Button type="submit" loading={loginMutation.isPending}>
                {t("auth.login_btn")}
              </Button>
              <Divider />
              <GoogleAuthButton mode="signin" />
              <button
                type="button"
                onClick={() => setTab("forgot")}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-center transition-colors">
                {t("auth.forgot_password")}
              </button>
            </form>
          )}

          {/* Register form */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <input name="name" type="text" placeholder={t("auth.name_placeholder")} required className={INPUT_CLS} />
              <input name="email" type="email" placeholder={t("auth.email_placeholder")} required className={INPUT_CLS} />
              <div className="relative">
                <input name="password" type={showRegisterPwd ? "text" : "password"} placeholder={t("auth.password_placeholder")} required className={INPUT_CLS + " w-full pr-9"} />
                <button type="button" onClick={() => setShowRegisterPwd((v) => !v)} className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <EyeIcon visible={showRegisterPwd} />
                </button>
              </div>
              {registerMutation.isError && (
                <p className="text-sm text-red-600">{t("auth.register_error")}</p>
              )}
              <Button type="submit" loading={registerMutation.isPending}>
                {t("auth.register_btn")}
              </Button>
              <Divider />
              <GoogleAuthButton mode="signup" />
            </form>
          )}

          {/* Forgot password form */}
          {tab === "forgot" && <ForgotForm onBack={() => setTab("login")} />}
        </div>
      </div>
    </div>
  );
}
