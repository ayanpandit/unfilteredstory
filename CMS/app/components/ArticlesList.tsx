"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getArticles, publishArticle, archiveArticle, unarchiveArticle, deleteArticle } from "../lib/api";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  viewCount: number;
  createdAt: string;
  author: { id: string; name: string };
  category: { id: string; name: string };
}

interface ArticlesListProps {
  onNewArticle: () => void;
  onEdit: (id: string) => void;
}

export default function ArticlesList({ onNewArticle, onEdit }: ArticlesListProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), limit: "20" };
      if (filter !== "all") params.status = filter;
      const result = await getArticles(params);
      setArticles(result.data || result);
      if (result.meta) setMeta(result.meta);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handlePublish = async (id: string) => {
    try {
      await publishArticle(id);
      fetchArticles();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveArticle(id);
      fetchArticles();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await unarchiveArticle(id);
      fetchArticles();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article permanently?")) return;
    try {
      await deleteArticle(id);
      fetchArticles();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const statusTabs = [
    { key: "all", label: "All" },
    { key: "DRAFT", label: "Draft" },
    { key: "REVIEW", label: "Review" },
    { key: "PUBLISHED", label: "Published" },
    { key: "ARCHIVED", label: "Archived" },
  ];

  return (
    <div className="articles-list">
      <div className="page-header">
        <h1>Articles</h1>
        <button className="btn-primary" onClick={onNewArticle}>+ New Article</button>
      </div>

      <div className="filter-tabs">
        {statusTabs.map((t) => (
          <button
            key={t.key}
            className={`filter-tab ${filter === t.key ? "active" : ""}`}
            onClick={() => { setFilter(t.key); setPage(1); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#f87171", padding: "1rem" }}>{error}</p>}

      {loading ? (
        <p style={{ color: "#94a3b8", padding: "2rem" }}>Loading articles...</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Views</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>No articles found.</td></tr>
                )}
                {articles.map((a) => (
                  <tr key={a.id}>
                    <td className="td-title">{a.title}</td>
                    <td>{a.author?.name || "—"}</td>
                    <td><span className="category-badge">{a.category?.name || "—"}</span></td>
                    <td><span className={`status-badge ${a.status.toLowerCase()}`}>{a.status}</span></td>
                    <td className="td-date">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="td-views">{a.viewCount > 0 ? a.viewCount.toLocaleString() : "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-sm" onClick={() => onEdit(a.id)}>Edit</button>
                        {(a.status === "DRAFT" || a.status === "REVIEW") && (
                          <button className="btn-sm approve" onClick={() => handlePublish(a.id)}>Publish</button>
                        )}
                        {a.status === "PUBLISHED" && (
                          <button className="btn-sm" onClick={() => handleArchive(a.id)}>Archive</button>
                        )}
                        {a.status === "ARCHIVED" && (
                          <button className="btn-sm unarchive" onClick={() => handleUnarchive(a.id)}>Unarchive</button>
                        )}
                        <button className="btn-sm danger" onClick={() => handleDelete(a.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", padding: "1rem" }}>
              <button className="btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span style={{ color: "#94a3b8", padding: "0.5rem" }}>Page {page} of {meta.totalPages}</span>
              <button className="btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
