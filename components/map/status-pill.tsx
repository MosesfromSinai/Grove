// Open/closed pill from canvas screen 3, used in the place sheet and the list cards.
export function StatusPill({ open }: { open: boolean }) {
  return (
    <span
      className={`whitespace-nowrap rounded-pill px-2 py-0.5 text-xs font-bold ${open ? "bg-green-tint text-green-dark" : "bg-border text-ink-muted"}`}
    >
      {open ? "Open now" : "Closed"}
    </span>
  );
}
