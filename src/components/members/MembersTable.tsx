"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCircle, Phone, Ticket, Trash2, RefreshCw } from "lucide-react";
import type { MembershipRow, DailyPassRow } from "@/lib/types";
import { sendManualReminder } from "@/app/dashboard/seats/actions";
import { deleteDailyPass } from "@/app/dashboard/members/actions";
import Link from "next/link";
import { AddDailyPassModal } from "@/components/members/AddDailyPassModal";
import { RenewMembershipModal } from "@/components/members/RenewMembershipModal";

const FILTERS = ["All", "Active", "Renewal due", "Expired", "Daily Pass"] as const;
type Filter = (typeof FILTERS)[number];

type DisplayRow =
  | { kind: "membership"; data: MembershipRow }
  | { kind: "daily_pass"; data: DailyPassRow };

function membershipStatusPill(row: MembershipRow) {
  if (row.status === "cancelled") {
    return { label: "Cancelled", className: "bg-ink-text/10 text-ink-text/50" };
  }
  if (row.days_until_expiry < 0) {
    return { label: "Overdue", className: "bg-terracotta/15 text-terracotta" };
  }
  if (row.days_until_expiry <= 3) {
    return { label: "Renewal due", className: "bg-brass/15 text-brass-soft" };
  }
  return { label: "Active", className: "bg-sage/15 text-sage" };
}

export function MembersTable({
  rows,
  dailyPasses,
}: {
  rows: MembershipRow[];
  dailyPasses: DailyPassRow[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [renewTarget, setRenewTarget] = useState<MembershipRow | null>(null);

  async function handleDeletePass(id: string) {
    setDeletingId(id);
    await deleteDailyPass(id);
    setDeletingId(null);
  }

  async function handleRemind(membershipId: string) {
    setSendingId(membershipId);
    await sendManualReminder(membershipId);
    setSendingId(null);
  }

  const filtered = useMemo<DisplayRow[]>(() => {
    const allRows: DisplayRow[] = [
      ...rows.map((r) => ({ kind: "membership" as const, data: r })),
      ...dailyPasses.map((r) => ({ kind: "daily_pass" as const, data: r })),
    ];

    return allRows.filter((row) => {
      const name = row.data.full_name;
      const phone = row.data.phone;
      const seatCode = row.kind === "membership" ? row.data.seat_code : "";

      const matchesQuery =
        query.trim() === "" ||
        name.toLowerCase().includes(query.toLowerCase()) ||
        phone.includes(query) ||
        seatCode.toLowerCase().includes(query.toLowerCase());

      if (!matchesQuery) return false;

      if (filter === "All") return true;
      if (filter === "Daily Pass") return row.kind === "daily_pass";
      if (row.kind === "daily_pass") return false;

      const r = row.data;
      if (filter === "Active") return r.status === "active" && r.days_until_expiry > 3;
      if (filter === "Renewal due")
        return r.status === "active" && r.days_until_expiry >= 0 && r.days_until_expiry <= 3;
      if (filter === "Expired") return r.status !== "active" || r.days_until_expiry < 0;
      return true;
    });
  }, [rows, dailyPasses, query, filter]);

  return (
    <>
      <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-text/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone, or seat…"
              className="w-full rounded-lg border border-parchment-line bg-white/70 py-2.5 pl-9 pr-3 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-ink-text/5 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    filter === f
                      ? "bg-white text-ink-text shadow-sm"
                      : "text-ink-text/50 hover:text-ink-text"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ink-text px-3 py-2 text-xs font-medium text-parchment transition hover:bg-ink"
            >
              <Ticket size={13} />
             Add Daily Pass Member
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-parchment-line text-xs uppercase tracking-wider text-ink-text/40">
                <th className="py-3 font-mono">Member</th>
                <th className="py-3 font-mono">Seat</th>
                <th className="py-3 font-mono">Duration</th>
                <th className="py-3 font-mono">Start</th>
                <th className="py-3 font-mono">End</th>
                <th className="py-3 font-mono">Status</th>
                <th className="py-3 font-mono text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                if (row.kind === "daily_pass") {
                  const dp = row.data;
                  return (
                    <motion.tr
                      key={`dp-${dp.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
                      className="border-b border-parchment-line/60 last:border-0"
                    >
                      <td className="py-3">
                        <p className="font-medium text-ink-text">{dp.full_name}</p>
                        <p className="flex items-center gap-1.5 text-xs text-ink-text/45">
                          <Phone size={11} />
                          {dp.phone}
                        </p>
                      </td>
                      <td className="py-3">
                        <span className="rounded-md bg-ink-text/5 px-2 py-1 font-mono text-xs text-ink-text/40">
                          —
                        </span>
                      </td>
                      <td className="py-3 text-ink-text/70">Daily Pass — ₹200</td>
                      <td className="py-3 text-ink-text/70">
                        {new Date(dp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="py-3 text-ink-text/70">
                        {new Date(dp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-600">
                          Daily Pass
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeletePass(dp.id)}
                          disabled={deletingId === dp.id}
                          className="inline-flex items-center gap-1.5 rounded-md border border-terracotta/30 px-2.5 py-1.5 text-xs font-medium text-terracotta transition hover:bg-terracotta/10 disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                          {deletingId === dp.id ? "Removing…" : "Remove"}
                        </button>
                      </td>
                    </motion.tr>
                  );
                }

                const row_ = row.data;
                const pill = membershipStatusPill(row_);
                return (
                  <motion.tr
                    key={row_.membership_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
                    className="border-b border-parchment-line/60 last:border-0"
                  >
                    <td className="py-3">
                      <Link
                        href={`/dashboard/members/${row_.member_id}`}
                        className="font-medium text-ink-text hover:underline"
                      >
                        {row_.full_name}
                      </Link>
                      <p className="flex items-center gap-1.5 text-xs text-ink-text/45">
                        <Phone size={11} />
                        {row_.phone}
                      </p>
                    </td>
                    <td className="py-3">
                      <span className="rounded-md bg-ink-text/5 px-2 py-1 font-mono text-xs text-ink-text/70">
                        {row_.seat_code}
                      </span>
                    </td>
                    <td className="py-3 text-ink-text/70">
                      {row_.duration_months === 1 ? "1 Month" : `${row_.duration_months} Months`}
                    </td>
                    <td className="py-3 text-ink-text/70">
                      {new Date(row_.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="py-3 text-ink-text/70">
                      {new Date(row_.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pill.className}`}>
                        {pill.label}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setRenewTarget(row_)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-brass/30 px-2.5 py-1.5 text-xs font-medium text-brass-soft transition hover:bg-brass/10"
                        >
                          <RefreshCw size={13} />
                          Renew
                        </button>
                        <button
                          onClick={() => handleRemind(row_.membership_id)}
                          disabled={sendingId === row_.membership_id}
                          className="inline-flex items-center gap-1.5 rounded-md border border-sage/30 px-2.5 py-1.5 text-xs font-medium text-sage transition hover:bg-sage/10 disabled:opacity-50"
                        >
                          <MessageCircle size={13} />
                          {sendingId === row_.membership_id ? "Sending…" : "Remind"}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-text/40">No members match your search.</p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <AddDailyPassModal
            onClose={() => setShowModal(false)}
            onAdded={() => setShowModal(false)}
          />
        )}
        {renewTarget && (
          <RenewMembershipModal
            membership={renewTarget}
            onClose={() => setRenewTarget(null)}
            onRenewed={() => setRenewTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
