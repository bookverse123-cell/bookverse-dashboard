"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { LockerAllocationFinanceRow, MembershipMonthRow, MembershipPaymentRow } from "@/lib/types";

const CATEGORY_LABEL: Record<MembershipPaymentRow["category"], string> = {
  assigned: "Seat assigned",
  unassigned: "Non-assigned",
  daily_pass: "Daily pass",
};

const CATEGORY_COLOR: Record<MembershipPaymentRow["category"], string> = {
  assigned: "text-sage",
  unassigned: "text-brass-soft",
  daily_pass: "text-blue-500",
};

const CATEGORY_BG: Record<MembershipPaymentRow["category"], string> = {
  assigned: "bg-sage/10 border-sage/20",
  unassigned: "bg-brass/10 border-brass/20",
  daily_pass: "bg-blue-50 border-blue-200",
};

export function MembershipAnalyticsCard({
  monthly,
  payments,
  lockerAllocations,
  scopeLabel,
  showSummary = true,
  showLockerBreakup = true,
  showChart = true,
  showLedger = true,
}: {
  monthly: MembershipMonthRow[];
  payments: MembershipPaymentRow[];
  lockerAllocations: LockerAllocationFinanceRow[];
  scopeLabel: string;
  showSummary?: boolean;
  showLockerBreakup?: boolean;
  showChart?: boolean;
  showLedger?: boolean;
}) {
  const [categoryFilter, setCategoryFilter] = useState<MembershipPaymentRow["category"] | "all">("all");

  const totalAssigned = monthly.reduce((s, m) => s + m.assignedRevenue, 0);
  const totalUnassigned = monthly.reduce((s, m) => s + m.unassignedRevenue, 0);
  const totalDailyPass = monthly.reduce((s, m) => s + m.dailyPassRevenue, 0);
  const total = totalAssigned + totalUnassigned + totalDailyPass;

  const filteredPayments = payments.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    return true;
  });

  const lockerExpenseRows = lockerAllocations;

  const lockerExpenseTotal = lockerExpenseRows.reduce((sum, row) => sum + row.amount, 0);
  const lockerExpenseCash = lockerExpenseRows.reduce((sum, row) => {
    if (row.payment_method === "cash") return sum + row.amount;
    if (row.payment_method === "cash_upi") return sum + Number(row.cash_amount ?? 0);
    return sum;
  }, 0);
  const lockerExpenseUpi = lockerExpenseRows.reduce((sum, row) => {
    if (row.payment_method === "upi") return sum + row.amount;
    if (row.payment_method === "cash_upi") return sum + Number(row.upi_amount ?? 0);
    return sum;
  }, 0);
  const lockerExpenseSplit = lockerExpenseRows.reduce((sum, row) => {
    if (row.payment_method === "cash_upi") return sum + row.amount;
    return sum;
  }, 0);
  const lockerAllocationCount = lockerExpenseRows.length;

  const chartData = monthly.map((m) => ({
    month: m.month,
    "Assigned": m.assignedRevenue,
    "Unassigned": m.unassignedRevenue,
    "Daily Pass": m.dailyPassRevenue,
  }));

  return (
    <div className="space-y-4">
      {showSummary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Seat assigned", value: totalAssigned, cls: "border-sage/20 bg-sage/10", text: "text-sage" },
            { label: "Non-assigned", value: totalUnassigned, cls: "border-brass/20 bg-brass/10", text: "text-brass-soft" },
            { label: "Daily passes", value: totalDailyPass, cls: "border-blue-200 bg-blue-50", text: "text-blue-500" },
            { label: "Total revenue", value: total, cls: "border-ink-line/10 bg-white/60", text: "text-ink-text" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.cls}`}>
              <p className={`text-xs font-mono uppercase tracking-wider ${s.text}`}>{s.label}</p>
              <p className="mt-1 text-xl font-medium text-ink-text">₹{s.value.toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      )}

      {showLockerBreakup && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg text-ink-text">Locker expense breakup</h3>
              <p className="text-sm text-ink-text/50">
                {lockerExpenseRows.length} entries · {scopeLabel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-terracotta/20 bg-terracotta/8 p-4">
              <p className="text-xs font-mono uppercase tracking-wider text-terracotta">Allocated lockers</p>
              <p className="mt-1 text-xl font-medium text-ink-text">{lockerAllocationCount}</p>
            </div>
            <div className="rounded-xl border border-terracotta/20 bg-terracotta/8 p-4">
              <p className="text-xs font-mono uppercase tracking-wider text-terracotta">Total locker amount</p>
              <p className="mt-1 text-xl font-medium text-ink-text">₹{lockerExpenseTotal.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border border-ink-line/10 bg-white/80 p-4 sm:col-span-2">
              <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Cash</p>
              <p className="mt-1 text-xl font-medium text-ink-text">₹{lockerExpenseCash.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border border-ink-line/10 bg-white/80 p-4 sm:col-span-2">
              <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">UPI</p>
              <p className="mt-1 text-xl font-medium text-ink-text">₹{lockerExpenseUpi.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border border-ink-line/10 bg-white/80 p-4 sm:col-span-2">
              <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Cash + UPI split</p>
              <p className="mt-1 text-xl font-medium text-ink-text">₹{lockerExpenseSplit.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </motion.div>
      )}

      {showChart && monthly.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6"
        >
          <h3 className="font-display text-lg text-ink-text mb-1">Membership revenue split</h3>
          <p className="text-sm text-ink-text/50 mb-4">Current scope: {scopeLabel}</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#28365C" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8C96AC" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: "#8C96AC" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#10192B",
                    border: "none",
                    borderRadius: 12,
                    color: "#F7F2E7",
                    fontSize: 13,
                  }}
                  formatter={(value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Assigned" fill="#7FA37A" radius={[6, 6, 0, 0]} barSize={14} />
                <Bar dataKey="Unassigned" fill="#B39C6A" radius={[6, 6, 0, 0]} barSize={14} />
                <Bar dataKey="Daily Pass" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {showLedger && (
        <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg text-ink-text">Payment ledger</h3>
            <p className="text-sm text-ink-text/50">{filteredPayments.length} entries</p>
          </div>
          <div className="flex gap-1 rounded-lg bg-ink-text/5 p-1">
            {(["all", "assigned", "unassigned", "daily_pass"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  categoryFilter === cat
                    ? "bg-white text-ink-text shadow-sm"
                    : "text-ink-text/50 hover:text-ink-text"
                }`}
              >
                {cat === "all" ? "All" : CATEGORY_LABEL[cat]}
              </button>
            ))}
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-text/40">No entries for selected filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-line/10">
                  <th className="pb-2 text-left font-mono text-xs uppercase tracking-wider text-ink-text/40">Date</th>
                  <th className="pb-2 text-left font-mono text-xs uppercase tracking-wider text-ink-text/40">Member</th>
                  <th className="pb-2 text-left font-mono text-xs uppercase tracking-wider text-ink-text/40">Seat</th>
                  <th className="pb-2 text-left font-mono text-xs uppercase tracking-wider text-ink-text/40">Type</th>
                  <th className="pb-2 text-right font-mono text-xs uppercase tracking-wider text-ink-text/40">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line/5">
                {filteredPayments.slice(0, 100).map((p) => (
                  <tr key={p.id} className="hover:bg-ink-text/5 transition-colors">
                    <td className="py-2.5 pr-4 text-ink-text/60 tabular-nums">{p.date}</td>
                    <td className="py-2.5 pr-4 font-medium text-ink-text">{p.memberName}</td>
                    <td className="py-2.5 pr-4 text-ink-text/60">{p.seatCode ?? "—"}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_BG[p.category]} ${CATEGORY_COLOR[p.category]}`}>
                        {CATEGORY_LABEL[p.category]}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-medium text-sage tabular-nums">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayments.length > 100 && (
              <p className="mt-3 text-center text-xs text-ink-text/40">
                Showing 100 of {filteredPayments.length} entries
              </p>
            )}
          </div>
        )}
        </motion.div>
      )}
    </div>
  );
}
