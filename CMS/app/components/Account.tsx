"use client";

import React, { useState, useEffect } from "react";
import { getMe, updateMe, changePassword } from "../lib/api";

interface AccountProps {
  onUserUpdated: (user: any) => void;
}

export default function Account({ onUserUpdated }: AccountProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    getMe()
      .then((u: any) => {
        setName(u.name || "");
        setEmail(u.email || "");
        setUsername(u.username || "");
        setRole(u.role || "");
        setCreatedAt(u.createdAt || "");
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateMe({ name: name.trim() || undefined, email: email.trim() || undefined });
      setSuccess("Profile updated successfully!");
      onUserUpdated(updated);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPwSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(""), 3000);
    } catch (e: any) {
      setPwError(e.message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-muted)" }}>
        Loading account...
      </div>
    );
  }

  const roleColor: Record<string, string> = { ADMIN: "#ef4444", EDITOR: "#eab308", REPORTER: "#6366f1" };
  const roleBgColor: Record<string, string> = { ADMIN: "rgba(239,68,68,0.08)", EDITOR: "rgba(234,179,8,0.08)", REPORTER: "rgba(99,102,241,0.08)" };
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Account</h1>
          <p className="page-subtitle">Manage your personal details</p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 24,
        maxWidth: 900,
      }}>
        {/* ─── Profile Card ─── */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}>
          {/* Card header with avatar */}
          <div style={{
            background: "var(--navy)",
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--yellow)",
              color: "var(--navy)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
            }}>
              {initials}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{name || "—"}</div>
              <div style={{ color: "#94a3b8", fontSize: 13, fontFamily: "monospace" }}>@{username}</div>
            </div>
          </div>

          {/* Info rows */}
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Role</span>
              <span style={{
                padding: "3px 12px",
                borderRadius: 100,
                background: roleBgColor[role] || "var(--bg)",
                color: roleColor[role] || "var(--text)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.3px",
              }}>{role}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Email</span>
              <span style={{ fontSize: 13, color: "var(--text)" }}>{email}</span>
            </div>
            {createdAt && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Member since</span>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{new Date(createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Edit Form ─── */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Edit Profile</h3>
          </div>

          <div style={{ padding: "20px 24px" }}>
            {/* Alerts */}
            {error && (
              <div style={{
                background: "#fef2f2",
                color: "#dc2626",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                border: "1px solid #fecaca",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>⚠</span> {error}
              </div>
            )}
            {success && (
              <div style={{
                background: "#f0fdf4",
                color: "#16a34a",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>✓</span> {success}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Username — read only */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  disabled
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    background: "var(--bg)",
                    color: "var(--text-muted)",
                    cursor: "not-allowed",
                    opacity: 0.7,
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>Username cannot be changed</span>
              </div>

              {/* Role — read only */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Role
                </label>
                <input
                  type="text"
                  value={role}
                  disabled
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    background: "var(--bg)",
                    color: "var(--text-muted)",
                    cursor: "not-allowed",
                    opacity: 0.7,
                  }}
                />
              </div>

              {/* Name — editable */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    outline: "none",
                    background: "var(--bg)",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--yellow)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              {/* Email — editable */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    outline: "none",
                    background: "var(--bg)",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--yellow)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{ alignSelf: "flex-start", padding: "10px 28px", fontSize: 14, marginTop: 4 }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>

        {/* ─── Change Password ─── */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
          gridColumn: "1 / -1",
          maxWidth: 480,
        }}>
          <div style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Change Password</h3>
          </div>

          <div style={{ padding: "20px 24px" }}>
            {pwError && (
              <div style={{
                background: "#fef2f2",
                color: "#dc2626",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                border: "1px solid #fecaca",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>⚠</span> {pwError}
              </div>
            )}
            {pwSuccess && (
              <div style={{
                background: "#f0fdf4",
                color: "#16a34a",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>✓</span> {pwSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    outline: "none",
                    background: "var(--bg)",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--yellow)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    outline: "none",
                    background: "var(--bg)",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--yellow)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    outline: "none",
                    background: "var(--bg)",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--yellow)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={savingPassword}
                style={{ alignSelf: "flex-start", padding: "10px 28px", fontSize: 14, marginTop: 4 }}
              >
                {savingPassword ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
