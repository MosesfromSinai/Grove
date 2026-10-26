import { getDeals } from "@/lib/deals";
import { DealCard } from "@/components/deal-card";

export default async function FeedPage() {
  const deals = await getDeals();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Deals</h1>
      {deals.length === 0 ? (
        <p className="text-black/50">No deals right now. Check back soon.</p>
      ) : (
        <ul className="space-y-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </ul>
      )}
    </div>
  );
}