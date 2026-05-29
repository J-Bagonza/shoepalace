"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function SearchBar({ value = "", onChange }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g. clear filters)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.slice(0, 100);
    setLocalValue(raw);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(raw.trim() || undefined);
    }, 400);
  }

  function handleClear() {
    setLocalValue("");
    onChange(undefined);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") handleClear();
  }

  return (
    <div className="relative w-full">
      {/* Search icon */}
      <span
        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400
          text-xs pointer-events-none select-none"
        aria-hidden="true"
      >
        &#x2315;
      </span>

      <input
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search styles, colours..."
        maxLength={100}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="w-full border border-neutral-200 bg-white pl-10 pr-10
          py-3 text-sm text-neutral-900 placeholder:text-neutral-400
          focus:border-neutral-900 focus:outline-none
          transition-colors duration-150"
      />

      {/* Clear button */}
      <AnimatePresence>
        {localValue && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2
              text-neutral-400 hover:text-neutral-900 transition-colors
              text-xs uppercase tracking-widest"
            aria-label="Clear search"
          >
            ✕
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}