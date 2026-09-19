import React, { useState } from "react";
import { useDora } from "./DoraProvider";

/**
 * A small, collapsible panel letting the authenticated client change their
 * own admin password. Renders nothing outside admin mode / before login —
 * drop it anywhere in your tree alongside <ThemeEditor>.
 */
export function AdminAccountPanel() {
  const { isAdminMode, isAuthenticated, api } = useDora();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "success"; message: string } | null>(null);

  if (!isAdminMode || !isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword.length < 8) {
      setStatus({ kind: "error", message: "New password must be at least 8 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ kind: "error", message: "New passwords don't match" });
      return;
    }

    setSubmitting(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setStatus({ kind: "success", message: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not change password" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={open ? "dora-account-panel dora-account-panel--open" : "dora-account-panel"}>
      <button type="button" className="dora-account-panel-toggle" onClick={() => setOpen((prev) => !prev)} aria-expanded={open}>
        Account {open ? "▾" : "▸"}
      </button>
      {open && (
        <form className="dora-account-panel-form" onSubmit={handleSubmit}>
          <p className="dora-account-panel-heading">Change password</p>
          <label>
            Current password
            <input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            New password
            <input
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className="dora-account-panel-show-toggle">
            <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} />
            Show passwords
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Change password"}
          </button>
          {status && (
            <p className={status.kind === "error" ? "dora-account-panel-error" : "dora-account-panel-success"}>
              {status.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
