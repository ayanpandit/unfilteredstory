"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getTags, createTag, deleteTag } from "../lib/api";

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: { articles: number };
}

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      const data = await getTags();
      setTags(Array.isArray(data) ? data : data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const handleAdd = async () => {
    if (!newTag.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createTag({ name: newTag.trim() });
      setNewTag("");
      fetchTags();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    try {
      await deleteTag(id);
      fetchTags();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="tags-page">
      <div className="page-header">
        <h1>Tags</h1>
      </div>

      {error && <p style={{ color: "#f87171", padding: "0.5rem 0" }}>{error}</p>}

      <div className="tag-add-row">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add new tag..."
          className="tag-add-input"
        />
        <button className="btn-primary" onClick={handleAdd} disabled={saving}>
          {saving ? "Adding..." : "Add Tag"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8", padding: "2rem" }}>Loading tags...</p>
      ) : (
        <>
          <div className="tags-cloud">
            {tags.map((tag) => (
              <div key={tag.id} className="tag-cloud-item">
                <span className="tag-name">{tag.name}</span>
                <span className="tag-count">{tag._count?.articles ?? 0}</span>
                <button className="tag-delete" onClick={() => handleDelete(tag.id)}>×</button>
              </div>
            ))}
            {tags.length === 0 && <p style={{ color: "#64748b" }}>No tags yet.</p>}
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Slug</th>
                  <th>Articles</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((t) => (
                  <tr key={t.id}>
                    <td className="td-title">{t.name}</td>
                    <td className="td-mono">{t.slug}</td>
                    <td>{t._count?.articles ?? 0}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-sm danger" onClick={() => handleDelete(t.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
