"use client";

import React, { useState, useRef, useEffect } from "react";

interface HeaderProps {
  user: { id: string; name: string; email: string; role: string };
  onNewArticle: () => void;
  onLogout: () => void;
}

export default function Header({ user, onNewArticle, onLogout }: HeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="cms-header">
      <div className="header-search">
        <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#e2e8f0" }}>
          Welcome, {user.name}
        </h2>
      </div>

      <div className="header-actions">
        <button className="btn-new-article" onClick={onNewArticle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Article
        </button>

        <div className="header-profile-wrap" ref={profileRef}>
          <button
            className="header-profile-btn"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="profile-avatar">{initials}</div>
            <span className="profile-name">{user.name}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showProfile && (
            <div className="dropdown-panel profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-avatar large">{initials}</div>
                <div>
                  <div className="profile-dropdown-name">{user.name}</div>
                  <div className="profile-dropdown-role">{user.role}</div>
                </div>
              </div>
              <div className="dropdown-divider" />
              <div style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", color: "#94a3b8" }}>
                {user.email}
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item logout" onClick={onLogout}>Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
