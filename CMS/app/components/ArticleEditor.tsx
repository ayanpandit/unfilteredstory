"use client";

import React, { useState, useEffect } from "react";
import { getArticleById, createArticle, updateArticle, getCategories, getTags } from "../lib/api";

interface ArticleEditorProps {
  articleId: string | null;
  onBack: () => void;
}

export default function ArticleEditor({ articleId, onBack }: ArticleEditorProps) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState("");

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!articleId);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([getCategories(), getTags()])
      .then(([cats, tgs]) => {
        setCategories(Array.isArray(cats) ? cats : cats.data || []);
        setTags(Array.isArray(tgs) ? tgs : tgs.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    getArticleById(articleId)
      .then((a) => {
        setTitle(a.title || "");
        setExcerpt(a.excerpt || "");
        setContent(typeof a.content === "object" && a.content?.text ? a.content.text : typeof a.content === "string" ? a.content : JSON.stringify(a.content || ""));
        setCategoryId(a.categoryId || a.category?.id || "");
        setSelectedTagIds(a.tags?.map((t: any) => t.tagId || t.tag?.id || t.id) || []);
        setFeaturedImage(a.featuredImage || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [articleId]);

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!categoryId) { setError("Category is required"); return; }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        title,
        excerpt: excerpt || undefined,
        content: content ? { text: content } : undefined,
        categoryId,
        featuredImage: featuredImage || undefined,
        tagIds: selectedTagIds.length ? selectedTagIds : undefined,
      };

      if (articleId) {
        await updateArticle(articleId, payload);
        setSuccess("Article updated!");
      } else {
        await createArticle(payload);
        setSuccess("Article created!");
        setTimeout(() => onBack(), 1000);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  if (loading) {
    return (
      <div className="article-editor">
        <p style={{ color: "#94a3b8", padding: "2rem" }}>Loading article...</p>
      </div>
    );
  }

  return (
    <div className="article-editor">
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <button className="btn-outline" onClick={onBack}>← Back to Articles</button>
          <h3 style={{ margin: 0, color: "#e2e8f0" }}>{articleId ? "Edit Article" : "New Article"}</h3>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : articleId ? "Update" : "Create Draft"}
        </button>
      </div>

      {error && <p style={{ color: "#f87171", padding: "0.5rem 1rem", margin: 0 }}>{error}</p>}
      {success && <p style={{ color: "#22c55e", padding: "0.5rem 1rem", margin: 0 }}>{success}</p>}

      <div className="editor-layout">
        <div className="editor-main">
          <input
            type="text"
            className="editor-headline"
            placeholder="Enter headline..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="editor-meta-row">
            <div className="meta-field">
              <label>Excerpt</label>
              <input
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Short summary of the article"
              />
            </div>
            <div className="meta-field">
              <label>Featured Image URL</label>
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <textarea
            className="editor-body"
            placeholder="Write your article content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
          />
        </div>

        <div className="editor-sidebar">
          <div className="sidebar-section">
            <h4>Category</h4>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="sidebar-select">
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="sidebar-section">
            <h4>Tags</h4>
            <div className="tags-list" style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className={`tag-chip ${selectedTagIds.includes(tag.id) ? "active" : ""}`}
                  style={{
                    cursor: "pointer",
                    opacity: selectedTagIds.includes(tag.id) ? 1 : 0.5,
                    border: selectedTagIds.includes(tag.id) ? "1px solid #6366f1" : "1px solid #334155",
                  }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </span>
              ))}
              {tags.length === 0 && <span style={{ color: "#64748b", fontSize: "0.85rem" }}>No tags available</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
