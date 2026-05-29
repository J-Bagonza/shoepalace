"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const ModelViewer = dynamic(
  () =>
    import("./model-viewer").then((mod) => ({ default: mod.ModelViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-square bg-[#F5F0E8] flex items-center
        justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-px w-24 bg-neutral-200 overflow-hidden">
            <div className="h-full w-1/2 bg-neutral-400 animate-pulse" />
          </div>
          <span className="text-[10px] uppercase tracking-widest
            text-neutral-400">
            Loading 3D Model
          </span>
        </div>
      </div>
    ),
  },
);

interface ModelViewerWrapperProps {
  modelUrl: string | null;
  fallback?: React.ReactNode;
}

export function ModelViewerWrapper({
  modelUrl,
  fallback,
}: ModelViewerWrapperProps) {
  const [mode, setMode] = useState<"image" | "3d">("image");
  const [loadError, setLoadError] = useState(false);

  if (!modelUrl) return <>{fallback}</>;

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 w-fit">
        <button
          onClick={() => setMode("image")}
          className={`px-4 py-1.5 text-[10px] uppercase tracking-widest
            transition-colors duration-150 ${
              mode === "image"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
        >
          Photos
        </button>
        <button
          onClick={() => setMode("3d")}
          className={`px-4 py-1.5 text-[10px] uppercase tracking-widest
            transition-colors duration-150 ${
              mode === "3d"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
        >
          3D View
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={mode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {mode === "image" ? (
          fallback
        ) : loadError ? (
          <div className="w-full aspect-square bg-[#F5F0E8] flex flex-col
            items-center justify-center gap-3">
            <p className="text-xs uppercase tracking-widest text-neutral-400">
              3D model unavailable
            </p>
            <button
              onClick={() => {
                setLoadError(false);
                setMode("image");
              }}
              className="text-xs text-neutral-500 underline underline-offset-4
                hover:text-neutral-900"
            >
              View Photos
            </button>
          </div>
        ) : (
          <ModelViewer url={modelUrl} />
        )}
      </motion.div>
    </div>
  );
}