import Link from "next/link";

export default function StickerNotFound() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-student px-4 py-10 text-center text-ink">
      <h1 className="text-2xl">We couldn&apos;t find that restaurant</h1>
      <p className="mt-2 text-ink-muted">The sticker may be damaged or out of date.</p>
      <Link
        href="/feed"
        className="mt-6 inline-flex min-h-11 items-center rounded-button bg-ink px-6 font-semibold text-white"
      >
        Browse deals
      </Link>
    </div>
  );
}
