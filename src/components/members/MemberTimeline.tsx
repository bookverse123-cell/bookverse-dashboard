import type { MemberHistoryEntry } from "@/lib/types";

function statusPill(status: MemberHistoryEntry["status"]) {
  if (status === "active") return "bg-sage/15 text-sage";
  if (status === "cancelled") return "bg-terracotta/15 text-terracotta";
  return "bg-ink-text/10 text-ink-text/50";
}

function statusLabel(status: MemberHistoryEntry["status"]) {
  if (status === "active") return "Active";
  if (status === "cancelled") return "Cancelled";
  return "Expired";
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function methodLabel(method: string) {
  const map: Record<string, string> = {
    cash: "Cash",
    upi: "UPI",
    card: "Card",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };
  return map[method] ?? method;
}

export function MemberTimeline({ memberships }: { memberships: MemberHistoryEntry[] }) {
  if (memberships.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ink-text/40">No membership history found.</p>
    );
  }

  return (
    <div className="relative">
      {memberships.map((m, i) => {
        const isLast = i === memberships.length - 1;
        const primaryPayment = m.payments[0];
        const durationLabel = m.duration_months === 1 ? "1 Month" : `${m.duration_months} Months`;

        return (
          <div key={m.membership_id} className="relative flex gap-4">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-brass bg-parchment" />
              {!isLast && <div className="mt-1 w-px grow bg-parchment-line" />}
            </div>

            {/* Card */}
            <div className={`${isLast ? "mb-0" : "mb-6"} flex-1 rounded-xl border border-parchment-line bg-white/60 p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink-text">
                    {fmt(m.start_date)} → {fmt(m.end_date)}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-ink-text/40 uppercase tracking-wider">
                    {durationLabel}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill(m.status)}`}>
                  {statusLabel(m.status)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-text/70">
                <span>₹{m.amount_paid.toLocaleString("en-IN")}</span>
                {m.batch && <span className="text-ink-text/60">· {m.batch}</span>}
                {primaryPayment && (
                  <span className="text-ink-text/40">· {methodLabel(primaryPayment.method)}</span>
                )}
              </div>

              {m.remarks && (
                <p className="mt-2 text-xs italic text-ink-text/50">{m.remarks}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
