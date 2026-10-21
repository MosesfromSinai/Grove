import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

// Team preview of the Grove theme in app/globals.css. Not linked from the app.
export const metadata: Metadata = {
  title: "Theme · Grove",
  robots: { index: false },
};

const colors = [
  { name: "green", hex: "#1E7A46", use: "Brand, icons, live dots", swatch: "bg-green" },
  { name: "green-dark", hex: "#135C33", use: "Active nav, links, hover", swatch: "bg-green-dark" },
  { name: "green-tint", hex: "#DDF0E2", use: "Active nav pill, success", swatch: "bg-green-tint" },
  { name: "orange", hex: "#FF8A1F", use: "Main actions, deal tags", swatch: "bg-orange" },
  { name: "orange-light", hex: "#FFB36B", use: "Slogan, timer icons", swatch: "bg-orange-light" },
  { name: "peach", hex: "#FFE6CC", use: "Badges", swatch: "bg-peach" },
  { name: "peach-deep", hex: "#FFD8B0", use: "Avatar tiles", swatch: "bg-peach-deep" },
  { name: "brown", hex: "#8A3B04", use: "Students-only badge, BUSINESS tag", swatch: "bg-brown" },
  { name: "ink", hex: "#1A2019", use: "Main text, dark buttons", swatch: "bg-ink" },
  { name: "ink-muted", hex: "#4F564D", use: "Secondary text", swatch: "bg-ink-muted" },
  { name: "ink-nav", hex: "#3F463D", use: "Nav items", swatch: "bg-ink-nav" },
  { name: "ink-fine", hex: "#5E655C", use: "Fine print", swatch: "bg-ink-fine" },
  { name: "bg-student", hex: "#FBF7EF", use: "Student app background", swatch: "bg-bg-student" },
  { name: "bg-dashboard", hex: "#F7F2E8", use: "Dashboard background", swatch: "bg-bg-dashboard" },
  { name: "surface", hex: "#FFFFFF", use: "Student cards, bottom nav", swatch: "bg-surface" },
  { name: "surface-dashboard", hex: "#FFFDF8", use: "Dashboard cards", swatch: "bg-surface-dashboard" },
  { name: "border", hex: "#ECE5D6", use: "Default dividers and outlines", swatch: "bg-border" },
  { name: "border-strong", hex: "#E3DCCB", use: "Inputs, chips", swatch: "bg-border-strong" },
  { name: "border-soft", hex: "#F0EADC", use: "List dividers", swatch: "bg-border-soft" },
];

export default function ThemePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl">Grove theme</h1>
        <p className="text-ink-muted">
          Tokens from <code>CLAUDE.md</code> → Design reference, defined in <code>app/globals.css</code>. Use the
          name after <code>bg-</code>, <code>text-</code>, or <code>border-</code>.
        </p>
      </header>

      <section aria-labelledby="colors-h" className="flex flex-col gap-4">
        <h2 id="colors-h" className="text-2xl">Colors</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {colors.map((c) => (
            <li key={c.name} className="flex flex-col overflow-hidden rounded-card bg-surface shadow-card">
              <span className={`h-16 border-b border-border ${c.swatch}`} aria-hidden="true" />
              <span className="flex flex-col gap-0.5 p-3">
                <span className="font-bold">{c.name}</span>
                <span className="font-mono text-sm text-ink-muted">{c.hex}</span>
                <span className="text-sm text-ink-fine">{c.use}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="type-h" className="flex flex-col gap-4">
        <h2 id="type-h" className="text-2xl">Type</h2>
        <div className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
          <p className="text-sm font-bold text-ink-muted">Bricolage Grotesque 800 · headings (font-heading)</p>
          <p className="font-heading text-4xl font-extrabold tracking-[-0.02em]">$2 off any burrito</p>
          <p className="text-sm font-bold text-ink-muted">Figtree 400–800 · body (font-sans)</p>
          <p className="text-base">Any burrito on the menu, $2 off. One per student per day.</p>
          <p className="text-base font-extrabold">Orange Peel Tacos · taco truck</p>
        </div>
      </section>

      <section aria-labelledby="parts-h" className="flex flex-col gap-4">
        <h2 id="parts-h" className="text-2xl">Card and buttons</h2>
        <div className="flex flex-wrap items-start gap-6">
          <article className="flex w-full max-w-sm flex-col overflow-hidden rounded-card bg-surface shadow-card">
            <div className="relative flex h-36 items-center justify-center bg-peach-deep">
              <span className="absolute left-3 top-3 rounded-pill bg-ink px-3 py-1.5 text-sm font-bold text-surface">
                2:18:40 left
              </span>
              <span className="absolute right-3 top-3 rounded-pill bg-surface px-3 py-1.5 text-xs font-extrabold text-brown">
                UCR students only
              </span>
            </div>
            <div className="flex flex-col gap-1.5 p-4">
              <span className="text-sm font-bold text-ink-muted">Orange Peel Tacos · taco truck</span>
              <h3 className="text-xl">$2 off any burrito</h3>
              <span className="text-sm text-ink-muted">0.3 mi · Until 3 PM</span>
            </div>
          </article>

          <div className="flex flex-col gap-3">
            <Button>Post a deal (default)</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">End now</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="shape-h" className="flex flex-col gap-4">
        <h2 id="shape-h" className="text-2xl">Shape</h2>
        <div className="flex flex-wrap gap-4">
          <span className="flex h-20 w-28 items-center justify-center rounded-card border border-border-strong bg-surface text-sm">rounded-card</span>
          <span className="flex h-20 w-28 items-center justify-center rounded-button border border-border-strong bg-surface text-sm">rounded-button</span>
          <span className="flex h-11 items-center rounded-pill border border-border-strong bg-surface px-4 text-sm">rounded-pill</span>
          <span className="flex h-20 w-28 items-center justify-center rounded-card bg-surface text-sm shadow-card">shadow-card</span>
        </div>
      </section>
    </main>
  );
}
