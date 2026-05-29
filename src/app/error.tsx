"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-px w-8 bg-[#E8001D] mx-auto" />
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Something Went Wrong
        </h1>
        <p className="text-sm text-neutral-400 max-w-sm">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-[10px] uppercase tracking-widest text-neutral-300">
            Reference: {error.digest}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="bg-neutral-900 text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-neutral-700 transition-colors duration-200"
        >
          Try Again
        </button>
        <a
          href="/"
          className="text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-4"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}