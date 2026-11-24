"use client";

export default function StudentError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="pt-10 text-center">
      <h1 className="text-2xl">Something went wrong</h1>
      <p className="mt-2 text-ink-muted">Check your connection and try again.</p>
      <button
        onClick={reset}
        className="mt-6 min-h-11 rounded-button bg-ink px-6 font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
