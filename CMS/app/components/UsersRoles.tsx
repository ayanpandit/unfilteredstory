"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../lib/api";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "REPORTER";
  isActive: boolean;
  _count?: { articles: number };
  createdAt: string;
}

interface UsersRolesProps {
  currentUser: { id: string; role: string };
}

const roleColors: Record<string, string> = {
  ADMIN: "#ef4444",
  EDITOR: "#eab308",
  REPORTER: "#6366f1",
};

const roleBg: Record<string, string> = {
  ADMIN: "rgba(239,68,68,0.08)",
  EDITOR: "rgba(234,179,8,0.08)",
  REPORTER: "rgba(99,102,241,0.08)",
};

export default function UsersRoles({ currentUser }: UsersRolesProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("REPORTER");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const result = await getUsers({ limit: "100" });
      setUsers(result.data || result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRoleChange = async (user: User, role: string) => {
    if (user.id === currentUser.id) {
      alert("You cannot change your own role.");
      return;
    }
    try {
      await updateUser(user.id, { role });
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (!confirm("Delete this user permanently?")) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setGeneratedPassword("");
    setCreating(true);
    try {
      const result = await createUser({ name: newName.trim(), username: newUsername.trim(), email: newEmail.trim(), role: newRole });
      setGeneratedPassword(result.generatedPassword);
      setNewName(""); setNewUsername(""); setNewEmail(""); setNewRole("REPORTER");
      fetchUsers();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const filtered = filterRole === "all" ? users : users.filter((u) => u.role === filterRole);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Users &amp; Roles</h1>
          <p className="page-subtitle">{users.length} total users</p>
        </div>
        {currentUser.role === "ADMIN" && (
          <button
            className="btn-primary"
            onClick={() => { setShowCreateForm(!showCreateForm); setGeneratedPassword(""); setCreateError(""); }}
          >
            {showCreateForm ? "✕ Cancel" : "+ New User"}
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: "#fef2f2", color: "#dc2626", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 13, border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {/* ─── Create New User Panel ─── */}
      {showCreateForm && (
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
          marginBottom: 24,
          overflow: "hidden",
        }}>
          {/* Panel header */}
          <div style={{
            background: "var(--navy)",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 600, margin: 0 }}>Create New User</h3>
          </div>

          <div style={{ padding: "20px 24px" }}>
            {/* Error */}
            {createError && (
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
                <span style={{ fontSize: 16 }}>⚠</span> {createError}
              </div>
            )}

            {/* Success — generated password */}
            {generatedPassword && (
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                padding: "14px 18px",
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "#16a34a", fontSize: 16 }}>✓</span>
                  <strong style={{ color: "#15803d", fontSize: 14 }}>User created successfully!</strong>
                </div>
                <div style={{
                  background: "#fff",
                  border: "1px solid #dcfce7",
                  borderRadius: 6,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}>
                  <div>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Generated Password</span>
                    <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#0f172a", userSelect: "all", letterSpacing: 1 }}>
                      {generatedPassword}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(generatedPassword); }}
                    className="btn-sm"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Copy
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                  Share this password securely — it won&apos;t be shown again.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateUser}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Jane Doe"
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
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="janedoe"
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
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="jane@example.com"
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
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 14,
                      outline: "none",
                      background: "var(--bg)",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <option value="REPORTER">Reporter</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              {/* Submit row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid var(--border-light)",
              }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  A random password will be generated
                </span>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                  style={{ padding: "10px 24px", fontSize: 14 }}
                >
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Role Summary Cards ─── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
        marginBottom: 20,
      }}>
        {(["ADMIN", "EDITOR", "REPORTER"] as const).map((role) => {
          const count = users.filter((u) => u.role === role).length;
          return (
            <div
              key={role}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "var(--shadow-sm)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onClick={() => setFilterRole(filterRole === role ? "all" : role)}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: roleBg[role],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: roleColors[role] }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>{role}S</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Filter Tabs ─── */}
      <div className="filter-tabs">
        {["all", "ADMIN", "EDITOR", "REPORTER"].map((f) => (
          <button
            key={f}
            className={`filter-tab ${filterRole === f ? "active" : ""}`}
            onClick={() => setFilterRole(f)}
          >
            {f === "all" ? "All Users" : f}
            <span className="tab-count">{f === "all" ? users.length : users.filter((u) => u.role === f).length}</span>
          </button>
        ))}
      </div>

      {/* ─── Users Table ─── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
          Loading users...
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-wrap" style={{ display: "var(--table-display, block)" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Articles</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>No users found.</td></tr>
                )}
                {filtered.map((u) => (
                  <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: roleBg[u.role],
                          color: roleColors[u.role],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13.5 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-muted)" }}>@{u.username}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        disabled={u.id === currentUser.id}
                        style={{
                          padding: "4px 8px",
                          border: `1px solid ${roleColors[u.role]}44`,
                          borderRadius: 6,
                          background: roleBg[u.role],
                          color: roleColors[u.role],
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: u.id === currentUser.id ? "not-allowed" : "pointer",
                          outline: "none",
                          opacity: u.id === currentUser.id ? 0.6 : 1,
                        }}
                      >
                        <option value="REPORTER">REPORTER</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      {u.id === currentUser.id && (
                        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 6 }}>(you)</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>{u._count?.articles ?? 0}</td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(u)}
                        style={{
                          padding: "4px 12px",
                          borderRadius: 100,
                          border: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: u.isActive ? "#22c55e18" : "#ef444418",
                          color: u.isActive ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {u.isActive ? "● Active" : "○ Inactive"}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn-sm danger"
                        onClick={() => handleDelete(u.id)}
                        disabled={u.id === currentUser.id}
                        style={{ opacity: u.id === currentUser.id ? 0.3 : 1 }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="users-mobile-cards">
            {filtered.map((u) => (
              <div key={u.id} style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 16,
                opacity: u.isActive ? 1 : 0.5,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: roleBg[u.role],
                    color: roleColors[u.role],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>@{u.username}</div>
                  </div>
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: 100,
                    background: roleBg[u.role],
                    color: roleColors[u.role],
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.3px",
                  }}>{u.role}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>{u.email}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{u._count?.articles ?? 0} articles</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleToggleActive(u)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 100,
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: u.isActive ? "#22c55e18" : "#ef444418",
                        color: u.isActive ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </button>
                    {u.id !== currentUser.id && (
                      <button className="btn-sm danger" onClick={() => handleDelete(u.id)}>Remove</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
