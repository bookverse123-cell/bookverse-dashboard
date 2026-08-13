"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, PauseCircle, PlayCircle } from "lucide-react";
import type { MemberHistoryEntry } from "@/lib/types";
import { MembershipRecordEditModal } from "@/components/members/MembershipRecordEditModal";

function isUpcoming(m: MemberHistoryEntry) {
  return new Date(m.start_date) > new Date();
}

function statusPill(m: MemberHistoryEntry) {
  if (m.status === "paused") return "bg-brass/15 text-brass-soft";
  if (isUpcoming(m)) return "bg-brass/15 text-brass-soft";
  if (m.status === "active") return "bg-sage/15 text-sage";
  if (m.status === "cancelled") return "bg-terracotta/15 text-terracotta";
  return "bg-ink-text/10 text-ink-text/50";
}

function statusLabel(m: MemberHistoryEntry) {
  if (m.status === "paused") return "Paused";
  if (isUpcoming(m)) return "Upcoming";
  if (m.status === "active") return "Active";
  if (m.status === "cancelled") return "Cancelled";
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
    upi_cash: "UPI + Cash",
    card: "Card",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };
  return map[method] ?? method;
}

function splitLabel(payment: MemberHistoryEntry["payments"][number]) {
  if (payment.method !== "upi_cash") return null;
  const cashAmount = payment.cash_amount ?? 0;
  const upiAmount = payment.upi_amount ?? 0;
  if (cashAmount <= 0 && upiAmount <= 0) return null;
  return `UPI ₹${upiAmount.toLocaleString("en-IN")} + Cash ₹${cashAmount.toLocaleString("en-IN")}`;
}

export function MemberTimeline({
  memberships,
  memberId,
}: {
  memberships: MemberHistoryEntry[];
  memberId: string;
}) {
  const router = useRouter();
  const [editingMembership, setEditingMembership] = useState<(MemberHistoryEntry & { member_id: string }) | null>(null);

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
        const primaryPaymentSplit = primaryPayment ? splitLabel(primaryPayment) : null;
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMembership({ ...m, member_id: memberId })}
                    className="inline-flex items-center gap-1 rounded-full border border-ink-line/15 bg-white/80 px-2.5 py-1 text-xs font-medium text-ink-text/60 transition hover:bg-ink-text/5 hover:text-ink-text"
                    aria-label={`Edit membership from ${fmt(m.start_date)} to ${fmt(m.end_date)}`}
                    title="Edit record"
                  >
                    <PencilLine size={12} />
                    Edit
                  </button>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill(m)}`}>
                    {statusLabel(m)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-text/70">
                <span>₹{m.amount_paid.toLocaleString("en-IN")}</span>
                {m.batch && <span className="text-ink-text/60">· {m.batch}</span>}
                {primaryPayment && (
                  <span className="text-ink-text/40">· {methodLabel(primaryPayment.method)}</span>
                )}
                {primaryPaymentSplit && (
                  <span className="text-ink-text/40">· {primaryPaymentSplit}</span>
                )}
              </div>

              {m.remarks && (
                <p className="mt-2 text-xs italic text-ink-text/50">{m.remarks}</p>
              )}

              {m.events.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-parchment-line pt-3">
                  {m.events.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-2 text-xs text-ink-text/50">
                      {ev.event_type === "paused" ? (
                        <PauseCircle size={12} className="mt-0.5 shrink-0 text-brass-soft" />
                      ) : (
                        <PlayCircle size={12} className="mt-0.5 shrink-0 text-sage" />
                      )}
                      <span>
                        <span className={ev.event_type === "paused" ? "text-brass-soft" : "text-sage"}>
                          {ev.event_type === "paused" ? "Paused" : "Resumed"}
                        </span>
                        {" · "}{fmt(ev.event_date)}
                        {ev.note && <span className="text-ink-text/35"> · {ev.note}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {editingMembership && (
        <MembershipRecordEditModal
          key={editingMembership.membership_id}
          membership={editingMembership}
          onClose={() => setEditingMembership(null)}
          onSaved={() => {
            setEditingMembership(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
