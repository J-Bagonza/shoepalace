"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: string;
  name: string;
  slug: string;
  position: number;
}

function slugify(text: string): string {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CategoriesForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((json: { data: Category[] }) => {
        setCategories(json.data ?? []);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (autoSlug) setNewSlug(slugify(newName));
  }, [newName, autoSlug]);

  async function handleAdd() {
    setError(null);
    setSuccess(null);

    if (!newName.trim()) {
      setError("Category name is required.");
      return;
    }
    if (!newSlug.trim()) {
      setError("Slug is required.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim(),
          position: categories.length,
        }),
      });

      const json = await res.json() as { data?: Category; error: string | null };

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to add category.");
        return;
      }

      if (json.data) {
        setCategories((prev) => [...prev, json.data!]);
      }
      setNewName("");
      setNewSlug("");
      setAutoSlug(true);
      setSuccess("Category added.");
    } catch {
      setError("Network error.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? Products using it will keep their current category value.`)) return;
    setError(null);
    setSuccess(null);
    setDeletingId(id);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to delete category.");
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSuccess("Category deleted.");
    } catch {
      setError("Network error.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-xs uppercase tracking-widest text-neutral-400">
        Loading categories...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Existing categories */}
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-widest text-neutral-400">
          Current Categories ({categories.length})
        </p>

        {categories.length === 0 ? (
          <div className="border border-neutral-100 p-6 text-center">
            <p className="text-sm text-neutral-400 uppercase tracking-widest">
              No categories yet.
            </p>
          </div>
        ) : (
          <div className="border border-neutral-100 overflow-hidden">
            {categories.map((cat, i) => (
              <div
                key={cat.id}
                className={`flex items-center justify-between px-4 py-3
                  border-b border-neutral-50 last:border-0
                  ${i % 2 === 0 ? "bg-white" : "bg-neutral-50/30"}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-neutral-900">{cat.name}</span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                    {cat.slug}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={deletingId === cat.id}
                  className="text-[10px] uppercase tracking-widest
                    text-neutral-400 hover:text-[#E8001D] transition-colors
                    disabled:opacity-40"
                >
                  {deletingId === cat.id ? "..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new category */}
      <div className="flex flex-col gap-3 border border-neutral-100 p-4">
        <p className="text-xs uppercase tracking-widest text-neutral-400">
          Add Category
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-neutral-400">
              Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Basketball"
              className="border border-neutral-200 px-3 py-2 text-sm
                focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-neutral-400">
              Slug
            </label>
            <input
              type="text"
              value={newSlug}
              onChange={(e) => {
                setAutoSlug(false);
                setNewSlug(e.target.value);
              }}
              placeholder="e.g. basketball"
              className="border border-neutral-200 px-3 py-2 text-sm
                focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>

        {!autoSlug && (
          <button
            type="button"
            onClick={() => { setAutoSlug(true); setNewSlug(slugify(newName)); }}
            className="self-start text-[10px] uppercase tracking-widest
              text-neutral-400 underline hover:text-neutral-900 transition-colors"
          >
            Reset to auto
          </button>
        )}

        <button
          onClick={handleAdd}
          disabled={adding}
          className="self-start bg-neutral-900 text-white px-5 py-2 text-xs
            uppercase tracking-widest hover:bg-neutral-700 transition-colors
            disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add Category"}
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-[#E8001D]"
            role="alert"
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-green-600 uppercase tracking-widest"
            role="status"
          >
            {success}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}