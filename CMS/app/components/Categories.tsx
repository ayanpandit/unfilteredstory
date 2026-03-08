"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { articles: number };
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSubmit = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateCategory(editingId, { name: newName, description: newDesc || undefined });
      } else {
        await createCategory({ name: newName, description: newDesc || undefined });
      }
      setNewName(""); setNewDesc(""); setEditingId(null);
      fetchCategories();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setNewDesc(cat.description || "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      fetchCategories();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null); setNewName(""); setNewDesc("");
  };

  return (
    <div className="categories-page">
      <div className="page-header">
        <h1>Categories</h1>
      </div>

      {error && <p style={{ color: "#f87171", padding: "0.5rem 0" }}>{error}</p>}

      <div className="categories-layout">
        <div className="category-form-panel">
          <h3>{editingId ? "Edit Category" : "Add New Category"}</h3>
          <div className="form-field">
            <label>Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name" />
          </div>
          <div className="form-field">
            <label>Slug</label>
            <input type="text" value={newName.toLowerCase().replace(/[^a-z0-9]+/g, "-")} readOnly className="slug-readonly" />
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Brief description" rows={3} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Category" : "Add Category"}
            </button>
            {editingId && <button className="btn-outline" onClick={handleCancel}>Cancel</button>}
          </div>
        </div>

        <div className="category-list-panel">
          {loading ? (
            <p style={{ color: "#94a3b8", padding: "2rem" }}>Loading...</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Articles</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>No categories yet.</td></tr>
                  )}
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="td-title">{c.name}</td>
                      <td className="td-mono">{c.slug}</td>
                      <td>{c.description || "—"}</td>
                      <td>{c._count?.articles ?? 0}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                          <button className="btn-sm danger" onClick={() => handleDelete(c.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
