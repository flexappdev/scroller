"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        background: "#0a0a0a",
        color: "#f4f4f5",
        fontFamily: "system-ui, -apple-system, sans-serif",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#71717a", marginBottom: 8 }}>
            Fatal error
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Scroller hit a fatal error.</h1>
          <p style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 16 }}>
            The root layout itself failed. {error.digest ? `Digest: ${error.digest}.` : ""} Reload to retry.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#052e22",
              border: "1px solid #047857",
              color: "#6ee7b7",
              padding: "8px 14px",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
