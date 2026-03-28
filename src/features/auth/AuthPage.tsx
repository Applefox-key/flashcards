import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/Button";
import { authApi } from "@/api";
import { useLogin, useRegister } from "./hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { PublicNavbar } from "@/components/PublicNavbar";

type AuthTab = "login" | "register" | "forgot";

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
      <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-center">
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
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 text-center mb-6">Password reset</h2>
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
          </form>
        )}

        {/* Forgot password form */}
        {tab === "forgot" && <ForgotForm onBack={() => setTab("login")} />}
      </div>
      </div>
    </div>
  );
}
