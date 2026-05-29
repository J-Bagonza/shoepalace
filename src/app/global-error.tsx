"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui",
          textAlign: "center",
          padding: "24px"
        }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>
            Something went wrong
          </h2>

          <p style={{ opacity: 0.7, marginBottom: "20px" }}>
            An unexpected error occurred. Please try again.
          </p>

          <button
            onClick={() => reset()}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              cursor: "pointer",
              background: "#111",
              color: "#fff"
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}