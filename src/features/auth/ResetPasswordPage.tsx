import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authApi } from "@/api";
import { Button } from "@/components/Button";

type Status = "validating" | "valid" | "expired" | "success";

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>("validating");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("expired");
      return;
    }
    authApi
      .validateResetToken(token)
      .then(() => setStatus("valid"))
      .catch(() => setStatus("expired"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await authApi.setNewPassword(password, token!);
      setStatus("success");
    } catch {
      setError("Failed to set password. The link may have expired.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-6">FlashMinds</h1>

        {status === "validating" && <p className="text-center text-gray-500 text-sm animate-pulse">Validating link…</p>}

        {status === "expired" && (
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Link expired</p>
            <p className="text-sm text-gray-500 mb-6">This reset link is invalid or has already been used.</p>
            <Link to="/login" className="text-sm text-indigo-600 hover:underline">
              ← Back to login
            </Link>
          </div>
        )}

        {status === "valid" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-800 text-center">Set new password</h2>

            <div>
              <label className="block text-xs text-gray-500 mb-1">New password</label>
              <input
                value={password}
                onChange={(e) => {
                  setError("");
                  setPassword(e.target.value);
                }}
                type="password"
                placeholder="At least 6 characters"
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Confirm password</label>
              <input
                value={confirm}
                onChange={(e) => {
                  setError("");
                  setConfirm(e.target.value);
                }}
                type="password"
                placeholder="Repeat new password"
                required
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  confirm && password !== confirm ? "border-red-300" : "border-gray-300"
                }`}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" loading={saving} disabled={!password || !confirm}>
              Set new password
            </Button>
          </form>
        )}

        {status === "success" && (
          <div className="text-center flex flex-col gap-4">
            <div className="text-green-600 text-4xl">✓</div>
            <p className="font-semibold text-gray-800">Password updated!</p>
            <p className="text-sm text-gray-500">You can now log in with your new password.</p>
            <Button onClick={() => navigate("/login")}>Go to login</Button>
          </div>
        )}
      </div>
    </div>
  );
}
