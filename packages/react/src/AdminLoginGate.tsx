import React, { useState } from "react";
import { useDora } from "./DoraProvider";

/**
 * Wrap your page (or admin overlay) with this. If the page is not in admin
 * mode, or the client is already signed in, it just renders children. If
 * admin mode is on but the client hasn't signed in yet, it shows a password
 * form and blocks children behind it.
 */
export function AdminLoginGate({ children }: { children: React.ReactNode }) {
  const { isAdminMode, isAuthenticated, login } = useDora();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isAdminMode || isAuthenticated) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dora-login-gate">
      <form onSubmit={handleSubmit} className="dora-login-form">
        <h2>Site admin login</h2>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
        />
        <button type="submit" disabled={submitting || !password}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        {error && <p className="dora-login-error">{error}</p>}
      </form>
    </div>
  );
}
