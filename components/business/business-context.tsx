"use client";

import Image from "next/image";
import { Store } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getMyBusiness, isMockData } from "@/lib/supabase";
import { BusinessAccessError } from "@/lib/supabase/business-errors";
import type { BusinessProfile } from "@/lib/supabase/types";

type BusinessContextValue = {
  profile: BusinessProfile | null;
  error: string;
  loading: boolean;
  refresh: () => void;
  updateProfile: (profile: BusinessProfile) => void;
};
const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    getMyBusiness().then(value => { if (active) { setProfile(value); setError(""); } })
      .catch(error => { if (active) setError(error instanceof BusinessAccessError
        ? error.code === "NOT_SIGNED_IN" ? "Sign in to load your business." : "Your account has multiple business memberships. Ask the Grove coordinator to confirm which business to use."
        : "We could not load your business. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  const refresh = useCallback(() => { setError(""); setLoading(true); setProfile(null); setRevision(value => value + 1); }, []);
  const updateProfile = useCallback((value: BusinessProfile) => { setProfile(value); setError(""); }, []);
  const value = useMemo(() => ({ profile, error, loading, refresh, updateProfile }), [profile, error, loading, refresh, updateProfile]);
  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const value = useContext(BusinessContext);
  if (!value) throw new Error("Business components must be inside BusinessProvider.");
  return value;
}

export function BusinessName() {
  const { profile } = useBusiness();
  return <>{profile?.business.name ?? "Your business"}</>;
}

export function BusinessIdentity() {
  const { profile, error, loading, refresh } = useBusiness();
  return <div className="my-5 rounded-button border border-border bg-bg-dashboard p-3 lg:my-7">
    <div className="flex items-center gap-3">
      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-button bg-peach-deep text-brown">
        {profile?.business.logo_url ? <Image src={profile.business.logo_url} alt="Business logo" fill sizes="44px" unoptimized className="object-cover" /> : <Store aria-hidden="true" className="size-5" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-extrabold [overflow-wrap:anywhere]">{profile?.business.name ?? (loading ? "Loading business…" : error ? "Business unavailable" : "No business linked")}</p>
        <p className="text-xs text-ink-fine">{profile?.business.is_truck ? "Food truck" : "Restaurant"} · UC Riverside</p>
      </div>
    </div>
    {error && <div className="mt-3 text-sm text-destructive"><p>{error}</p><Button variant="outline" onClick={refresh} className="mt-2">Retry business</Button></div>}
  </div>;
}

export function BusinessLoading() {
  const { error, loading, refresh } = useBusiness();
  return error ? <div role="alert" className="rounded-card border border-border bg-surface-dashboard p-6"><p className="text-destructive">{error}</p><Button onClick={refresh} className="mt-4">Retry business</Button></div>
    : loading ? <p role="status" className="p-6 text-ink-muted">Loading your business…</p>
      : <section className="rounded-card border border-border bg-surface-dashboard p-6"><h2 className="text-xl">Business access needed</h2><p className="mt-3 text-ink-muted">Your account is not linked to a business. Ask the Grove coordinator to provision your business and membership, then retry.</p><Button onClick={refresh} className="mt-4">Retry business</Button></section>;
}

export function BusinessDataNotice() {
  return <div className="border-b border-border-strong px-4 py-3 text-sm text-ink-muted sm:px-8 lg:px-10">
    <span className="font-bold text-green-dark">{isMockData ? "Dashboard preview" : "Business dashboard"}</span>
    <span>{isMockData ? " · Sample business. Changes reset on reload." : " · Changes are saved to your business account."}</span>
  </div>;
}
