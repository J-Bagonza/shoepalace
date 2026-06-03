"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { CmsPage, ContentBlock } from "@/types/page";

interface PageEditorProps {
  pages: CmsPage[];
}

const PAGE_LABELS: Record<string, string> = {
  about: "About",
  contact: "Contact",
  returns: "Returns Policy",
  faq: "FAQ",
  "size-guide": "Size Guide",
  careers: "Careers",
};

function BlockEditor({
  block,
  index,
  onChange,
  onRemove,
}: {
  block: ContentBlock;
  index: number;
  onChange: (b: ContentBlock) => void;
  onRemove: () => void;
}) {
  const base =
    "w-full border border-neutral-200 bg-white px-3 py-2 text-sm " +
    "text-neutral-900 focus:border-neutral-900 focus:outline-none " +
    "transition-colors";

  return (
    <div className="flex flex-col gap-2 border border-neutral-100 p-4
      bg-neutral-50">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest
          text-neutral-400">
          {block.type.replace("_", " ")}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-[10px] uppercase tracking-widest text-neutral-300
            hover:text-[#E8001D] transition-colors"
        >
          Remove
        </button>
      </div>

      {block.type === "heading" && (
        <input
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          className={base}
          placeholder="Heading text"
          maxLength={255}
        />
      )}

      {block.type === "paragraph" && (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          className={`${base} resize-none`}
          rows={3}
          placeholder="Paragraph text"
          maxLength={2000}
        />
      )}

      {block.type === "policy_item" && (
        <>
          <input
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            className={base}
            placeholder="Policy title"
            maxLength={255}
          />
          <textarea
            value={block.body}
            onChange={(e) => onChange({ ...block, body: e.target.value })}
            className={`${base} resize-none`}
            rows={2}
            placeholder="Policy description"
            maxLength={1000}
          />
        </>
      )}

      {block.type === "faq_item" && (
        <>
          <input
            value={block.question}
            onChange={(e) =>
              onChange({ ...block, question: e.target.value })
            }
            className={base}
            placeholder="Question"
            maxLength={255}
          />
          <textarea
            value={block.answer}
            onChange={(e) => onChange({ ...block, answer: e.target.value })}
            className={`${base} resize-none`}
            rows={2}
            placeholder="Answer"
            maxLength={1000}
          />
        </>
      )}

      {block.type === "contact_item" && (
        <>
          <input
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            className={base}
            placeholder="Label (e.g. Email)"
            maxLength={50}
          />
          <input
            value={block.value}
            onChange={(e) => onChange({ ...block, value: e.target.value })}
            className={base}
            placeholder="Value (e.g. hello@store.co.ke)"
            maxLength={255}
          />
        </>
      )}
    </div>
  );
}

function SinglePageEditor({ page }: { page: CmsPage }) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(
    page.content as ContentBlock[],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateBlock(index: number, block: ContentBlock) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? block : b)));
    setSuccess(false);
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    setSuccess(false);
  }

  function addBlock(type: ContentBlock["type"]) {
    const defaults: Record<ContentBlock["type"], ContentBlock> = {
      heading: { type: "heading", text: "" },
      paragraph: { type: "paragraph", text: "" },
      policy_item: { type: "policy_item", title: "", body: "" },
      faq_item: { type: "faq_item", question: "", answer: "" },
      contact_item: { type: "contact_item", label: "", value: "" },
    };
    setBlocks((prev) => [...prev, defaults[type]]);
    setSuccess(false);
  }

  async function handleSave() {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/pages/${page.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: page.title, content: blocks }),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to save page.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const ADD_BLOCK_TYPES: ContentBlock["type"][] = [
    "heading",
    "paragraph",
    "policy_item",
    "faq_item",
    "contact_item",
  ];

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="popLayout">
        {blocks.map((block, i) => (
          <motion.div
            key={`${block.type}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <BlockEditor
              block={block}
              index={i}
              onChange={(b) => updateBlock(i, b)}
              onRemove={() => removeBlock(i)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add block */}
      <div className="flex flex-wrap gap-2">
        {ADD_BLOCK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="text-[10px] uppercase tracking-widest px-3 py-1.5
              border border-neutral-200 text-neutral-500
              hover:border-neutral-900 hover:text-neutral-900
              transition-colors"
          >
            + {type.replace("_", " ")}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs text-[#E8001D]" role="alert">{error}</p>
      )}
      {success && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-green-600 uppercase tracking-widest"
        >
          Page saved.
        </motion.p>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="self-start bg-neutral-900 text-white px-8 py-3 text-xs
          uppercase tracking-widest hover:bg-neutral-700 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Save Page"}
      </button>
    </div>
  );
}

export function PageEditor({ pages }: PageEditorProps) {
  const [activePage, setActivePage] = useState<string>(
    pages[0]?.slug ?? "",
  );

  const currentPage = pages.find((p) => p.slug === activePage);

  return (
    <div className="flex flex-col gap-6">
      {/* Page selector */}
      <div className="flex flex-wrap gap-2">
        {pages.map((page) => (
          <button
            key={page.slug}
            onClick={() => setActivePage(page.slug)}
            className={clsx(
              "px-4 py-2 text-xs uppercase tracking-widest transition-colors",
              activePage === page.slug
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 text-neutral-500 hover:border-neutral-900",
            )}
          >
            {PAGE_LABELS[page.slug] ?? page.slug}
          </button>
        ))}
      </div>

      {/* Editor */}
      {currentPage ? (
        <SinglePageEditor key={currentPage.slug} page={currentPage} />
      ) : (
        <p className="text-sm text-neutral-400">No pages found.</p>
      )}
    </div>
  );
}