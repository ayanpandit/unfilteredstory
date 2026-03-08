"use client";

import React, { useEffect, useState } from "react";
import { getDashboard } from "../lib/api";

interface DashboardProps {
  onNavigate: (section: string) => void;
}

interface DashboardData {
  stats: {
    totalArticles: number;
    totalPublished: number;
    totalDrafts: number;
    totalReview: number;
    totalArchived: number;
    totalUsers: number;
    totalCategories: number;
    totalTags: number;
    totalViews: number;
  };
  recentArticles: {
    id: string;
    title: string;
    slug: string;
    status: string;
    viewCount: number;
    createdAt: string;
    publishedAt: string | null;
    author: { id: string; name: string };
    category: { id: string; name: string };
  }[];
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="page-header"><h1>Dashboard</h1></div>
        <p style={{ color: "#94a3b8", padding: "2rem" }}>Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard">
        <div className="page-header"><h1>Dashboard</h1></div>
        <p style={{ color: "#f87171", padding: "2rem" }}>{error || "Failed to load dashboard"}</p>
      </div>
    );
  }

  const { stats, recentArticles } = data;

  const statCards = [
    { label: "Published", value: stats.totalPublished, color: "#22c55e" },
    { label: "Drafts", value: stats.totalDrafts, color: "#6366f1" },
    { label: "In Review", value: stats.totalReview, color: "#f97316" },
    { label: "Archived", value: stats.totalArchived, color: "#64748b" },
    { label: "Total Articles", value: stats.totalArticles, color: "#06b6d4" },
    { label: "Total Views", value: stats.totalViews, color: "#a855f7" },
    { label: "Users", value: stats.totalUsers, color: "#eab308" },
    { label: "Categories", value: stats.totalCategories, color: "#ec4899" },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <h3>Recent Articles</h3>
            <button className="text-btn" onClick={() => onNavigate("articles")}>View All</button>
          </div>
          <div className="card-list">
            {recentArticles.length === 0 && (
              <p style={{ color: "#64748b", padding: "1rem" }}>No articles yet.</p>
            )}
            {recentArticles.map((a) => (
              <div key={a.id} className="card-list-item">
                <div className="item-main">
                  <div className="item-title">{a.title}</div>
                  <div className="item-meta">
                    {a.author.name} · {a.category.name} · {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`status-badge ${a.status.toLowerCase()}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
