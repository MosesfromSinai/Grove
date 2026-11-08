"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addStaff, getStaff, isMockData, removeStaff, type StaffMember } from "@/lib/supabase";
import { BusinessAccessError } from "@/lib/supabase/business-errors";
import { staffEmail, validStaff } from "@/lib/supabase/staff-input";
import { useBusiness } from "./business-context";

export function StaffManagement() {
  const { profile } = useBusiness();
  if (!profile) return null;
  return <section id="staff-access" aria-labelledby="staff-heading" className="mt-8 rounded-card border border-border bg-surface-dashboard p-5 sm:p-7">
    <div className="flex items-center gap-3"><Users aria-hidden className="size-5 text-green-dark" /><h2 id="staff-heading" className="text-2xl">Staff access</h2></div>
    {profile.membership_role !== "owner" ? <p className="mt-3 text-ink-muted">Only the owner can manage staff access. Ask your owner to add or remove staff.</p>
      : !isMockData ? <p className="mt-3 text-ink-muted">Staff management is not available yet. Grove’s staff invitation service is still being prepared. No access has been changed.</p>
      : <StaffList key={profile.business.id} businessId={profile.business.id} />}
  </section>;
}

type Action = { kind: "add"; email: string } | { kind: "remove"; member: StaffMember };
function StaffList({ businessId }: { businessId: string }) {
  const { refresh } = useBusiness();
  const [members, setMembers] = useState<StaffMember[] | null>(null);
  const [email, setEmail] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const confirmHeading = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const returnFocus = useRef(false);
  const life = useRef({ active: false, busy: false, pending: false, version: 0, blocked: false });
  const load = useCallback(async () => {
    const current = life.current;
    if (!current.active || current.pending || current.blocked) return;
    const version = ++current.version;
    setLoading(true); setError(""); setMembers(null); setChecked(false);
    try {
      const rows = await getStaff({ businessId });
      if (!current.active || current.version !== version) return;
      if (!Array.isArray(rows) || rows.some(m => !validStaff(m, businessId)) || new Set(rows.map(m => m.email)).size !== rows.length) throw new Error("Invalid roster");
      setMembers([...rows].sort((a, b) => a.role === b.role ? a.email.localeCompare(b.email) : a.role === "owner" ? -1 : 1));
      setChecked(true);
    } catch (cause) {
      if (!current.active || current.version !== version) return;
      if (cause instanceof BusinessAccessError) {
        current.blocked = true; setBlocked(true); setError("Your business access has changed. Reload your business before continuing.");
      } else setError("Could not load staff. Refresh the list to check current access.");
    } finally { if (current.active && current.version === version) setLoading(false); }
  }, [businessId]);

  useLayoutEffect(() => {
    const current = life.current;
    current.active = true;
    function leave() {
      returnFocus.current = false;
      current.active = false; ++current.version;
      if (current.busy) { setUncertain(true); setChecked(false); }
      current.busy = false; setBusy(false); setLoading(false); setAction(null); setMembers(null); setEmail("");
    }
    const visibility = () => {
      if (document.visibilityState === "hidden") leave();
      else { current.active = true; void load(); }
    };
    const resume = () => { current.active = true; void load(); };
    document.addEventListener("visibilitychange", visibility); window.addEventListener("pagehide", leave); window.addEventListener("pageshow", resume);
    return () => { leave(); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", leave); window.removeEventListener("pageshow", resume); };
  }, [load]);
  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);
  useEffect(() => {
    if (action) confirmHeading.current?.focus();
    else if (returnFocus.current) { returnFocus.current = false; input.current?.focus(); }
  }, [action]);

  const disabled = pending || loading || blocked || uncertain || members === null;
  function prepareAdd(event: React.FormEvent) {
    event.preventDefault();
    if (disabled || life.current.busy) return;
    setError(""); setNotice("");
    const normalized = staffEmail(email);
    if (!normalized) { setError("Enter the email they use for Google sign-in."); input.current?.focus(); return; }
    const existing = members?.find(m => m.email === normalized);
    if (existing) { setNotice(`${normalized} is already ${existing.role === "owner" ? "the owner" : existing.status === "active" ? "active staff" : "invited"}. No access was changed.`); return; }
    setAction({ kind: "add", email: normalized });
  }

  async function confirm() {
    const current = life.current;
    if (!action || disabled || current.busy || !current.active || document.visibilityState === "hidden") return;
    current.busy = true; current.pending = true; setPending(true);
    const version = ++current.version;
    setBusy(true); setError(""); setNotice(""); setChecked(false);
    const target = action.kind === "add" ? action.email : action.member.email;
    let reload = false;
    try {
      const result = action.kind === "add" ? await addStaff({ business_id: businessId, email: target }) : await removeStaff({ business_id: businessId, email: target });
      if (!current.active || current.version !== version) return;
      if (!result || typeof result.ok !== "boolean") throw new Error("Missing receipt");
      if (!result.ok) {
        if (result.error === "NOT_OWNER" || result.error === "NOT_SIGNED_IN") {
          current.blocked = true; setBlocked(true); setMembers(null);
          setError("Your business access has changed. Reload your business before continuing.");
        } else if (result.error === "STAFF_NOT_FOUND" || result.error === "OWNER_PROTECTED") {
          setNotice(result.error === "OWNER_PROTECTED" ? "Owner access cannot be removed here." : "That staff member is no longer on the list. Refresh to check current access.");
          setMembers(null);
        } else throw new Error("Unrecognized staff response");
      } else {
        if (action.kind === "add") {
          if (!("member" in result) || !validStaff(result.member, businessId) || result.member.email !== target || result.member.role !== "staff") throw new Error("Unexpected invitation receipt");
          setNotice(result.member.status === "active" ? `${target} has active staff access.` : `${target} is invited. They become active when they first sign in with Google. Grove sends no email.`);
          setEmail("");
        } else {
          if (!("email" in result) || result.email !== target) throw new Error("Unexpected removal receipt");
          setNotice(`${target}: ${action.member.status === "invited" ? "invitation cancelled" : "staff access removed"}.`);
        }
        reload = true;
      }
    } catch {
      if (!current.active || current.version !== version) return;
      setUncertain(true); setMembers(null); setChecked(false);
      setError("Could not confirm the change. Staff access may have changed. Refresh and check the list before making another change.");
    } finally {
      current.pending = false; setPending(false);
      if (current.active && current.version === version) { current.busy = false; setBusy(false); setAction(null); }
    }
    if (reload && current.active && current.version === version) await load();
  }

  return <>
    <p className="mt-3 text-sm leading-relaxed text-ink-muted">Use the email each person uses for Google sign-in. Invited staff become active on their first sign-in. Grove sends no invitation email.</p>
    <p className="mt-2 text-xs text-ink-muted">Sample data · changes reset when you reload Grove.</p>
    <div className="mt-5 flex flex-wrap gap-3">
      <Button variant="outline" disabled={pending || loading || blocked} onClick={() => { setAction(null); void load(); }}>Refresh staff</Button>
      {blocked && <Button onClick={refresh}>Reload business</Button>}
    </div>
    {pending && !busy && <p role="status" className="mt-4 text-sm text-ink-muted">A previous request is still finishing. Wait before refreshing to check access.</p>}
    {uncertain && <div className="mt-4 rounded-xl border border-border bg-peach/30 p-4"><p className="text-sm">A previous change is unconfirmed. Check the refreshed list carefully; nothing will be retried automatically.</p><Button className="mt-3" variant="outline" disabled={!checked || pending || loading || blocked} onClick={() => { setUncertain(false); setError(""); setNotice("Staff list reviewed. You can make a new change."); }}>I’ve checked — continue</Button></div>}
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="mt-4 break-words text-sm text-green-dark">{notice}</p>}
    {loading ? <p role="status" className="mt-5 text-sm text-ink-muted">Loading staff…</p> : members && <>
      {members.every(m => m.role === "owner") && <p className="mt-5 text-sm text-ink-muted">No staff added yet.</p>}
      <ul aria-label="Business members" className="mt-5 divide-y divide-border">
        {members.map(member => <li key={member.email} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0 flex-1 basis-44"><p className="break-words font-medium">{member.email}</p><p className="mt-1 text-sm text-ink-muted">{member.role === "owner" ? "Owner · access protected" : member.status === "active" ? "Active · signed in with Google" : "Invited · awaiting first Google sign-in"}</p></div>
          {member.role === "staff" && <Button variant="outline" disabled={disabled} aria-label={`${member.status === "invited" ? "Cancel invitation for" : "Remove"} ${member.email}`} onClick={() => { setError(""); setNotice(""); setAction({ kind: "remove", member }); }}>{member.status === "invited" ? "Cancel invitation" : "Remove staff"}</Button>}
        </li>)}
      </ul>
    </>}
    <form onSubmit={prepareAdd} className="mt-6 border-t border-border pt-5">
      <label htmlFor="staff-email" className="block text-sm font-bold">Google sign-in email</label>
      <div className="mt-2 flex flex-wrap gap-3"><input ref={input} id="staff-email" type="email" maxLength={254} required autoComplete="off" autoCapitalize="none" spellCheck={false} value={email} disabled={disabled || !!action} onChange={event => setEmail(event.target.value)} aria-describedby="staff-email-help" className="h-11 min-w-0 flex-1 basis-52 rounded-xl border border-border bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-green" /><Button type="submit" disabled={disabled || !!action} className="bg-green text-surface hover:bg-green-dark">Add staff</Button></div>
      <p id="staff-email-help" className="mt-2 text-xs text-ink-muted">Check the address with your staff member before granting access.</p>
    </form>
    {action && <div className="mt-5 rounded-xl border border-border bg-peach/30 p-5" aria-busy={busy}>
      <h3 ref={confirmHeading} tabIndex={-1} className="text-xl outline-none">{action.kind === "add" ? "Give this person staff access?" : action.member.status === "invited" ? "Cancel this invitation?" : "Remove staff access?"}</h3>
      <p className="mt-3 break-words font-bold">{action.kind === "add" ? action.email : action.member.email}</p>
      <p className="mt-2 text-sm text-ink-muted">{action.kind === "add" ? "They will be able to manage deals and verify visits for your business when they sign in. Grove sends no email." : "This removes their staff membership for this business. You can add them again by email later."}</p>
      <div className="mt-5 flex flex-wrap gap-3"><Button variant="outline" disabled={busy} onClick={() => { returnFocus.current = true; setAction(null); }}>Keep current access</Button><Button disabled={disabled} onClick={confirm} className="bg-green text-surface hover:bg-green-dark">{busy ? "Saving…" : action.kind === "add" ? "Confirm staff access" : "Confirm removal"}</Button></div>
    </div>}
  </>;
}
