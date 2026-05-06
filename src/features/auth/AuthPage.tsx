import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/Button";
import { authApi } from "@/api";
import { useLogin, useRegister } from "./hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { PublicNavbar } from "@/components/PublicNavbar";
type AuthTab = "login" | "register" | "forgot";

function getGoogleUrl() {
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
  const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;
  return `${base}/users/auth/google?redirect=${encodeURIComponent(appUrl)}`;
}

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const DIVIDER = (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
  </div>
);

const INPUT_CLS =
  "border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

// ── Forgot password form ─────────────────────────────────────────────────────

function ForgotForm({ onBack }: { onBack: () => void }) {
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
      setError("Could not send reset email. Check the address and try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="text-green-600 text-3xl">✉</div>
        <p className="font-semibold text-gray-800 dark:text-gray-200">Check your email</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          A password reset link was sent to <strong>{email}</strong>.
        </p>
        <button onClick={onBack} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2">
          ← Back to login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Enter your email and we'll send you a link to reset your password.
      </p>
      <input
        value={email}
        onChange={(e) => {
          setError("");
          setEmail(e.target.value);
        }}
        type="email"
        placeholder="Email"
        required
        className={INPUT_CLS}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={sending} disabled={!email}>
        Send reset link
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-center">
        ← Back to login
      </button>
    </form>
  );
}

// ── Main auth page ───────────────────────────────────────────────────────────

export function AuthPage() {
  const location = useLocation();
  const initialTab: AuthTab = (location.state as { tab?: AuthTab } | null)?.tab ?? "login";
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

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
              ▶ Try Demo — no account needed
            </button>
          </div>

          {/* Tabs (only for login/register) */}
          {tab !== "forgot" && (
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              {(["login", "register"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 pb-2 text-sm font-medium capitalize transition-colors ${
                    tab === t
                      ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Forgot password header */}
          {tab === "forgot" && (
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 text-center mb-6">
              Password reset
            </h2>
          )}

          {/* Login form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input name="email" type="email" placeholder="Email" required className={INPUT_CLS} />
              <input name="password" type="password" placeholder="Password" required className={INPUT_CLS} />
              {loginMutation.isError && <p className="text-sm text-red-600">Login failed. Check your credentials.</p>}
              <Button type="submit" loading={loginMutation.isPending}>
                Login
              </Button>
              {DIVIDER}
              <a
                href={getGoogleUrl()}
                className="flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium">
                {GOOGLE_ICON}
                Sign in with Google
              </a>
              <button
                type="button"
                onClick={() => setTab("forgot")}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-center transition-colors">
                Forgot password?
              </button>
            </form>
          )}

          {/* Register form */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <input name="name" type="text" placeholder="Name" required className={INPUT_CLS} />
              <input name="email" type="email" placeholder="Email" required className={INPUT_CLS} />
              <input name="password" type="password" placeholder="Password" required className={INPUT_CLS} />
              {registerMutation.isError && (
                <p className="text-sm text-red-600">Registration failed. Please try again.</p>
              )}
              <Button type="submit" loading={registerMutation.isPending}>
                Register
              </Button>
              {DIVIDER}

              <a
                href={getGoogleUrl()}
                className="flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium">
                {GOOGLE_ICON}
                Sign up with Google
              </a>
            </form>
          )}

          {/* Forgot password form */}
          {tab === "forgot" && <ForgotForm onBack={() => setTab("login")} />}
        </div>
      </div>
    </div>
  );
}
