"use client";

export default function SentryTestButton() {
  return (
    <button
      onClick={() => {
        throw new Error(
          "Sentry test error — this is intentional to verify Sentry is working",
        );
      }}
      className="mb-6 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        backgroundColor: "var(--color-accent-danger, #e74c3c)",
        color: "white",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      Test Sentry (throws error)
    </button>
  );
}
