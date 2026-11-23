import Link from "next/link";

export default function StudentNotFound() {
  return (
    <div className="pt-10 text-center">
      <h1 className="text-2xl">We couldn&apos;t find that</h1>
      <p className="mt-2 text-ink-muted">The deal may have ended, or the link is wrong.</p>
      <Link
        href="/feed"
        className="mt-6 inline-flex min-h-11 items-center rounded-button bg-ink px-6 font-semibold text-white"
      >
        Back to deals
      </Link>
    </div>
  );
}
