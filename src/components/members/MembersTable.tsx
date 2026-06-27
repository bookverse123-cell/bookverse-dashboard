"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Phone } from "lucide-react";
import type { MembershipRow } from "@/lib/demo-data";

const FILTERS = ["All", "Active", "Renewal due", "Expired"] as const;
type Filter = (typeof FILTERS)[number];

function statusPill(row: MembershipRow) {
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

export function MembersTable({ rows }: { rows: MembershipRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesQuery =
        query.trim() === "" ||
        row.full_name.toLowerCase().includes(query.toLowerCase()) ||
        row.phone.includes(query) ||
        row.seat_code.toLowerCase().includes(query.toLowerCase());

      if (!matchesQuery) return false;

      if (filter === "All") return true;
      if (filter === "Active") return row.status === "active" && row.days_until_expiry > 3;
      if (filter === "Renewal due")
        return row.status === "active" && row.days_until_expiry >= 0 && row.days_until_expiry <= 3;
      if (filter === "Expired") return row.status !== "active" || row.days_until_expiry < 0;
      return true;
    });
  }, [rows, query, filter]);

  return (
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-parchment-line text-xs uppercase tracking-wider text-ink-text/40">
              <th className="py-3 font-mono">Member</th>
              <th className="py-3 font-mono">Seat</th>
              <th className="py-3 font-mono">Plan</th>
              <th className="py-3 font-mono">Start</th>
              <th className="py-3 font-mono">End</th>
              <th className="py-3 font-mono">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const pill = statusPill(row);
              return (
                <motion.tr
                  key={row.membership_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
                  className="border-b border-parchment-line/60 last:border-0"
                >
                  <td className="py-3">
                    <p className="font-medium text-ink-text">{row.full_name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-text/45">
                      <Phone size={11} />
                      {row.phone}
                    </p>
                  </td>
                  <td className="py-3">
                    <span className="rounded-md bg-ink-text/5 px-2 py-1 font-mono text-xs text-ink-text/70">
                      {row.seat_code}
                    </span>
                  </td>
                  <td className="py-3 text-ink-text/70">{row.plan_label}</td>
                  <td className="py-3 text-ink-text/70">
                    {new Date(row.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="py-3 text-ink-text/70">
                    {new Date(row.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pill.className}`}>
                      {pill.label}
                    </span>
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
  );
}
