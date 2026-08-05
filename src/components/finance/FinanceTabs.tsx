"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { RevenueChart } from "./RevenueChart";
import { ExpenseBreakdownChart } from "./ExpenseBreakdownChart";
import { LedgerTable } from "./LedgerTable";
import { CafeteriaAnalyticsCard } from "./CafeteriaAnalyticsCard";
import { MembershipAnalyticsCard } from "./MembershipAnalyticsCard";
import type { LedgerRow, MembershipMonthRow, MembershipPaymentRow } from "@/lib/types";

const TABS = ["Overview", "Memberships", "Cafeteria", "Expenditures"] as const;
type Tab = (typeof TABS)[number];

const EXPENSE_CATEGORIES = [
  "Groceries & Snacks", "Utilities", "Maintenance", "Staff Wages", "Marketing", "Other",
];
const EXPENDITURE_CATEGORIES = [
  "Rent", "Furniture", "Equipment", "Renovation", "Branding", "Technology",
];

type MonthRow = {
  monthKey?: string;
  month: string;
  membershipRevenue: number;
  lockerRevenue: number;
  cafeteriaRevenue: number;
  cafeteriaExpense: number;
  expenditure: number;
};

function fmt(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}

function periodLabel(monthKey: string): string {
  const [y, mo] = monthKey.split("-").map(Number);
  const startDate = new Date(y, mo - 1, 15);
  const nextMo = mo === 12 ? 1 : mo + 1;
  const nextYr = mo === 12 ? y + 1 : y;
  const endDate = new Date(nextYr, nextMo - 1, 14);
  const fmt2 = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt2(startDate)} – ${fmt2(endDate)}`;
}

function periodShortLabel(monthKey: string): string {
  const [y, mo] = monthKey.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function zeroMonthRow(key: string): MonthRow {
  return {
    monthKey: key,
    month: periodShortLabel(key),
    membershipRevenue: 0,
    lockerRevenue: 0,
    cafeteriaRevenue: 0,
    cafeteriaExpense: 0,
    expenditure: 0,
  };
}

function keysInRange(from: string, to: string): string[] {
  const keys: string[] = [];
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  let y = fy, mo = fm;
  while (y < ty || (y === ty && mo <= tm)) {
    keys.push(`${y}-${String(mo).padStart(2, "0")}`);
    mo++; if (mo > 12) { mo = 1; y++; }
  }
  return keys;
}

function dateToBillingKey(dateStr: string): string {
  const parts = dateStr.slice(0, 10).split("-");
  let year = Number(parts[0]);
  let month = Number(parts[1]);
  const day = Number(parts[2]);
  if (day < 15) {
    month -= 1;
    if (month < 1) { month = 12; year -= 1; }
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function FinanceTabs({
  monthly,
  expenseBreakdown,
  expenses,
  sales,
  expenditures,
  membershipMonthly,
  membershipPayments,
}: {
  monthly: MonthRow[];
  expenseBreakdown: { category: string; amount: number }[];
  expenses: LedgerRow[];
  sales: LedgerRow[];
  expenditures: LedgerRow[];
  membershipMonthly: MembershipMonthRow[];
  membershipPayments: MembershipPaymentRow[];
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeKey, setActiveKey] = useState("");  // single selected billing period

  const hasFilter = !!activeKey;

  // All available billing periods (fill contiguous range from earliest to latest)
  const availablePeriods = useMemo(() => {
    const keys = new Set<string>();
    for (const m of monthly) { if (m.monthKey) keys.add(m.monthKey); }
    for (const m of membershipMonthly) { keys.add(m.monthKey); }
    if (keys.size === 0) return [];
    const sorted = Array.from(keys).sort();
    return keysInRange(sorted[0], sorted[sorted.length - 1]);
  }, [monthly, membershipMonthly]);

  // Track which keys have data
  const keysWithData = useMemo(() => {
    const s = new Set<string>();
    for (const m of monthly) { if (m.monthKey) s.add(m.monthKey); }
    return s;
  }, [monthly]);

  function handlePeriodClick(key: string) {
    setActiveKey(prev => prev === key ? "" : key);
    setSelectedIdx(null);
  }

  function clearFilter() {
    setActiveKey(""); setSelectedIdx(null);
  }

  // fromKey/toKey aliases for ledger filtering (same key = single period)
  const fromKey = activeKey;
  const toKey = activeKey;

  const filteredMonthly = useMemo(() => {
    if (!hasFilter) return monthly;
    const dataMap = new Map<string, MonthRow>();
    for (const m of monthly) { if (m.monthKey) dataMap.set(m.monthKey, m); }
    const row = dataMap.get(activeKey);
    return row ? [row] : [zeroMonthRow(activeKey)];
  }, [monthly, activeKey, hasFilter]);

  const filteredExpenses = useMemo(
    () => !hasFilter ? expenses : expenses.filter((r) => {
      const k = dateToBillingKey(r.date);
      return (!fromKey || k >= fromKey) && (!toKey || k <= toKey);
    }),
    [expenses, fromKey, toKey, hasFilter]
  );
  const filteredSales = useMemo(
    () => !hasFilter ? sales : sales.filter((r) => {
      const k = dateToBillingKey(r.date);
      return (!fromKey || k >= fromKey) && (!toKey || k <= toKey);
    }),
    [sales, fromKey, toKey, hasFilter]
  );
  const filteredExpenditures = useMemo(
    () => !hasFilter ? expenditures : expenditures.filter((r) => {
      const k = dateToBillingKey(r.date);
      return (!fromKey || k >= fromKey) && (!toKey || k <= toKey);
    }),
    [expenditures, fromKey, toKey, hasFilter]
  );

  const filteredMembershipMonthly = useMemo(() => {
    if (!hasFilter) return membershipMonthly;
    const row = membershipMonthly.find(m => m.monthKey === activeKey);
    return row ? [row] : [{ monthKey: activeKey, month: periodShortLabel(activeKey), assignedRevenue: 0, unassignedRevenue: 0, dailyPassRevenue: 0 }];
  }, [membershipMonthly, activeKey, hasFilter]);

  const filteredMembershipPayments = useMemo(
    () => !hasFilter ? membershipPayments : membershipPayments.filter((r) => {
      const k = dateToBillingKey(r.date);
      return (!fromKey || k >= fromKey) && (!toKey || k <= toKey);
    }),
    [membershipPayments, fromKey, toKey, hasFilter]
  );

  const allTime: MonthRow = {
    month: hasFilter ? "Selected range" : "All time",
    membershipRevenue: filteredMonthly.reduce((s, m) => s + m.membershipRevenue, 0),
    lockerRevenue: filteredMonthly.reduce((s, m) => s + (m.lockerRevenue ?? 0), 0),
    cafeteriaRevenue: filteredMonthly.reduce((s, m) => s + m.cafeteriaRevenue, 0),
    cafeteriaExpense: filteredMonthly.reduce((s, m) => s + m.cafeteriaExpense, 0),
    expenditure: filteredMonthly.reduce((s, m) => s + m.expenditure, 0),
  };

  const summary = selectedIdx !== null ? (filteredMonthly[selectedIdx] ?? allTime) : allTime;
  const totalIncome = summary.membershipRevenue + (summary.lockerRevenue ?? 0) + summary.cafeteriaRevenue;
  const net = totalIncome - summary.cafeteriaExpense - summary.expenditure;

  return (
    <div>
      {/* Billing period filter */}
      <div className="mb-6 rounded-2xl border border-ink-line/10 bg-white/90 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Filter by billing cycle</p>
            <p className="mt-0.5 text-xs text-ink-text/40">
              {activeKey ? `Showing: ${periodLabel(activeKey)}` : "Click a cycle to filter all tabs"}
            </p>
          </div>
          {hasFilter && (
            <button
              onClick={clearFilter}
              className="flex items-center gap-1.5 rounded-lg border border-terracotta/30 bg-terracotta/8 px-3 py-1.5 text-xs font-semibold text-terracotta transition hover:bg-terracotta/15"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Period pills */}
        {availablePeriods.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {availablePeriods.map((key) => {
              const isActive = key === activeKey;
              const hasData = keysWithData.has(key);
              return (
                <button
                  key={key}
                  onClick={() => handlePeriodClick(key)}
                  title={periodLabel(key) + (hasData ? "" : " · No data")}
                  className={[
                    "rounded-lg border px-3 py-2 text-xs font-medium transition-all select-none",
                    isActive
                      ? "border-brass bg-brass text-white shadow-md scale-[1.03]"
                      : "border-ink-line/20 bg-white text-ink-text/60 hover:border-brass/40 hover:text-ink-text hover:bg-brass/5",
                  ].join(" ")}
                >
                  {periodShortLabel(key)}
                  {!hasData && (
                    <span className={`ml-1 text-[10px] ${isActive ? "text-white/60" : "text-ink-text/30"}`}>·0</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-ink-text/40">No billing periods with data yet.</p>
        )}

        {/* Selected period breakdown */}
        <AnimatePresence>
          {hasFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 overflow-hidden border-t border-ink-line/8 pt-4"
            >
              {(() => {
                const m = filteredMonthly[0];
                if (!m) return null;
                const hasData = keysWithData.has(activeKey);
                const total = m.membershipRevenue + (m.lockerRevenue ?? 0) + m.cafeteriaRevenue;
                return (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Billing cycle</p>
                      <p className="mt-1 font-semibold text-ink-text">{periodLabel(activeKey)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Total revenue</p>
                      <p className={`mt-1 font-semibold ${hasData ? "text-sage" : "text-ink-text/30"}`}>
                        {hasData ? `₹${total.toLocaleString("en-IN")}` : "No data"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Net profit</p>
                      <p className={`mt-1 font-semibold ${hasData ? (total - m.cafeteriaExpense - m.expenditure >= 0 ? "text-sage" : "text-terracotta") : "text-ink-text/30"}`}>
                        {hasData ? `₹${(total - m.cafeteriaExpense - m.expenditure).toLocaleString("en-IN")}` : "—"}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-ink-text/5 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === t ? "text-ink-text" : "text-ink-text/50 hover:text-ink-text"
            }`}
          >
            {tab === t && (
              <motion.div
                layoutId="finance-tab-active"
                className="absolute inset-0 rounded-md bg-white shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-4">
          {/* Month filter */}
          {filteredMonthly.length > 0 && (
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-ink-text/5 p-1 w-fit max-w-full">
              <button
                onClick={() => setSelectedIdx(null)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  selectedIdx === null
                    ? "bg-white text-ink-text shadow-sm"
                    : "text-ink-text/50 hover:text-ink-text"
                }`}
              >
                {hasFilter ? `${filteredMonthly.length} periods` : "All time"}
              </button>
              {filteredMonthly.map((m, i) => (
                <button
                  key={m.monthKey ?? i}
                  onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    selectedIdx === i
                      ? "bg-white text-ink-text shadow-sm"
                      : "text-ink-text/50 hover:text-ink-text"
                  }`}
                >
                  {m.month}
                </button>
              ))}
            </div>
          )}

          {/* Breakdown card */}
          <motion.div
            key={selectedIdx ?? "all"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6"
          >
            <h3 className="font-display text-lg text-ink-text mb-4">
              {summary.month} — breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">
                  Membership fees
                </p>
                <p className="mt-1 text-xl font-medium text-ink-text">
                  {fmt(summary.membershipRevenue)}
                </p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">
                  Locker revenue
                </p>
                <p className="mt-1 text-xl font-medium text-ink-text">
                  {fmt(summary.lockerRevenue ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">
                  Cafeteria sales
                </p>
                <p className="mt-1 text-xl font-medium text-ink-text">
                  {fmt(summary.cafeteriaRevenue)}
                </p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">
                  Total income
                </p>
                <p className="mt-1 text-xl font-medium text-sage">{fmt(totalIncome)}</p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">
                  Operating expenses
                </p>
                <p className="mt-1 text-xl font-medium text-terracotta">
                  {fmt(summary.cafeteriaExpense)}
                </p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">
                  Expenditures
                </p>
                <p className="mt-1 text-xl font-medium text-brass-soft">
                  {fmt(summary.expenditure)}
                </p>
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">
                  Net profit
                </p>
                <p
                  className={`mt-1 text-xl font-medium ${
                    net >= 0 ? "text-sage" : "text-terracotta"
                  }`}
                >
                  {net < 0 ? "−" : ""}
                  {fmt(net)}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RevenueChart data={filteredMonthly} expenditures={filteredExpenditures} />
            <ExpenseBreakdownChart data={expenseBreakdown} />
          </div>
        </div>
      )}

      {tab === "Memberships" && (
        <MembershipAnalyticsCard
          monthly={filteredMembershipMonthly}
          payments={filteredMembershipPayments}
          lockerExpenses={filteredExpenditures}
        />
      )}

      {tab === "Cafeteria" && (
        <div className="space-y-4">
          <CafeteriaAnalyticsCard sales={filteredSales} expenses={filteredExpenses} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <LedgerTable
              title="Café sales"
              description="Daily counter sales income"
              rows={filteredSales}
              kind="sale"
              amountClassName="text-sage"
              amountPrefix="+ ₹"
            />
            <LedgerTable
              title="Café & operating expenses"
              description="Groceries, utilities, staff, and more"
              rows={filteredExpenses}
              kind="expense"
              categories={EXPENSE_CATEGORIES}
              amountClassName="text-terracotta"
              amountPrefix="- ₹"
            />
          </div>
        </div>
      )}

      {tab === "Expenditures" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <LedgerTable
            title="Expenditures"
            description="Furniture, equipment, renovations, branding, and capital spends"
            rows={filteredExpenditures}
            kind="expenditure"
            categories={EXPENDITURE_CATEGORIES}
            amountClassName="text-brass-soft"
            amountPrefix="₹"
          />
          <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
            <h3 className="font-display text-lg text-ink-text">Why track this?</h3>
            <p className="mt-2 text-sm text-ink-text/60">
              Expenditures are included in net profit, so you can see real
              month-by-month profitability after operating costs and capital spend.
            </p>
            <p className="mt-3 text-sm text-ink-text/60">
              Total expenditure so far:{" "}
              <span className="font-medium text-ink-text">
                ₹{filteredExpenditures.reduce((s, r) => s + r.amount, 0).toLocaleString("en-IN")}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
