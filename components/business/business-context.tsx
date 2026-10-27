"use client";

import Image from "next/image";
import { Store } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getMyBusiness } from "@/lib/supabase/business";
import type { BusinessProfile } from "@/lib/supabase/types";

type BusinessContextValue = {
  profile: BusinessProfile | null;
  error: string;
  refresh: () => void;
  updateProfile: (profile: BusinessProfile) => void;
};
const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    getMyBusiness().then(value => { if (active) { setProfile(value); setError(""); } })
      .catch(() => { if (active) setError("We could not load your business. Please try again."); });
    return () => { active = false; };
  }, [revision]);
  const refresh = useCallback(() => { setError(""); setRevision(value => value + 1); }, []);
  const updateProfile = useCallback((value: BusinessProfile) => { setProfile(value); setError(""); }, []);
  const value = useMemo(() => ({ profile, error, refresh, updateProfile }), [profile, error, refresh, updateProfile]);
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
  const { profile, error, refresh } = useBusiness();
  return <div className="my-5 rounded-button border border-border bg-bg-dashboard p-3 lg:my-7">
    <div className="flex items-center gap-3">
      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-button bg-peach-deep text-brown">
        {profile?.business.logo_url ? <Image src={profile.business.logo_url} alt="Business logo" fill sizes="44px" unoptimized className="object-cover" /> : <Store aria-hidden="true" className="size-5" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-extrabold [overflow-wrap:anywhere]">{profile?.business.name ?? (error ? "Business unavailable" : "Loading business…")}</p>
        <p className="text-xs text-ink-fine">Sample business · UC Riverside</p>
      </div>
    </div>
    {error && <div className="mt-3 text-sm text-destructive"><p>{error}</p><Button variant="outline" onClick={refresh} className="mt-2">Retry business</Button></div>}
  </div>;
}

export function BusinessLoading() {
  const { error, refresh } = useBusiness();
  return error ? <div role="alert" className="rounded-card border border-border bg-surface-dashboard p-6"><p className="text-destructive">{error}</p><Button onClick={refresh} className="mt-4">Retry business</Button></div>
    : <p role="status" className="p-6 text-ink-muted">Loading your business…</p>;
}
