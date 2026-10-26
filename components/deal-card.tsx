import type { Deal } from "@/lib/deals";

export function DealCard({ deal }: { deal: Deal }) {
  return (
    <li className="rounded-xl border border-black/10 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-black/50">{deal.restaurant}</p>
      <h2 className="mt-1 font-semibold">{deal.title}</h2>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="rounded-full bg-black/5 px-2 py-0.5">{deal.discount}</span>
        <span className="text-black/50">Expires {deal.expiresAt}</span>
      </div>
    </li>
  );
}