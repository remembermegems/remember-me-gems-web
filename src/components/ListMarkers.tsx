// Guarantees / promises — gold checkmark on a soft cream card.
export function CheckList({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl bg-warm-white px-6 py-6 space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className="text-gold mt-1" aria-hidden>
            ✓
          </span>
          <p className="font-body text-cocoa/90">{item}</p>
        </div>
      ))}
    </div>
  );
}

// Cautions / things to avoid — muted dash, no card (a checkmark would wrongly endorse).
export function DashList({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className="text-cocoa/40 mt-1" aria-hidden>
            —
          </span>
          <p className="font-body text-cocoa/90">{item}</p>
        </div>
      ))}
    </div>
  );
}

// Gentle prompts / examples — gold diamond on a soft cream card.
export function DiamondList({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl bg-warm-white px-6 py-6 space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className="text-gold mt-1" aria-hidden>
            ◆
          </span>
          <p className="font-body text-cocoa/90">{item}</p>
        </div>
      ))}
    </div>
  );
}

// Gentle guidance (e.g. Care's delicate-stones list) — gold star in a card.
export function StarList({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl bg-warm-white px-6 py-6 space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className="text-gold mt-1" aria-hidden>
            ★
          </span>
          <p className="font-body text-cocoa/90">{item}</p>
        </div>
      ))}
    </div>
  );
}
