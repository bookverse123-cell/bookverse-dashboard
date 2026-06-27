"use client";

import { motion } from "framer-motion";
import { Phone, AlertCircle } from "lucide-react";

type Renewal = {
  member_id: string;
  full_name: string;
  phone: string;
  seat_code: string;
  zone: string;
  days_until_expiry: number;
};

export function RenewalsList({ renewals }: { renewals: Renewal[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-ink-line/10 bg-white/60 p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <AlertCircle size={16} className="text-brass-soft" />
        <h3 className="font-display text-lg text-ink-text">Renewals due soon</h3>
      </div>

      {renewals.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-text/40">
          No memberships expiring in the next 3 days.
        </p>
      ) : (
        <ul className="space-y-3">
          {renewals.map((r, i) => (
            <motion.li
              key={r.member_id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className="flex items-center justify-between rounded-xl border border-parchment-line bg-white/70 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-ink-text">{r.full_name}</p>
                <p className="flex items-center gap-1.5 text-xs text-ink-text/45">
                  <span className="font-mono">{r.seat_code}</span>
                  <span>·</span>
                  <Phone size={11} />
                  {r.phone}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  r.days_until_expiry < 0
                    ? "bg-terracotta/15 text-terracotta"
                    : r.days_until_expiry === 0
                    ? "bg-terracotta/15 text-terracotta"
                    : "bg-brass/15 text-brass-soft"
                }`}
              >
                {r.days_until_expiry < 0
                  ? `${Math.abs(r.days_until_expiry)}d overdue`
                  : r.days_until_expiry === 0
                  ? "Today"
                  : `${r.days_until_expiry}d left`}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
