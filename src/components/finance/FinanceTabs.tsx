"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RevenueChart } from "./RevenueChart";
import { ExpenseBreakdownChart } from "./ExpenseBreakdownChart";
import { LedgerTable } from "./LedgerTable";
import type { LedgerRow } from "@/lib/types";

const TABS = ["Overview", "Cafeteria", "Expenditures"] as const;
type Tab = (typeof TABS)[number];

const EXPENSE_CATEGORIES = [
  "Groceries & Snacks", "Utilities", "Maintenance", "Staff Wages", "Marketing", "Other",
];
const EXPENDITURE_CATEGORIES = [
  "Furniture", "Equipment", "Renovation", "Branding", "Technology", "Other",
];

type MonthRow = {
  month: string;
  membershipRevenue: number;
  cafeteriaRevenue: number;
  cafeteriaExpense: number;
  expenditure: number;
};

function fmt(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}

export function FinanceTabs({
  monthly,
  expenseBreakdown,
  expenses,
  sales,
  expenditures,
}: {
  monthly: MonthRow[];
  expenseBreakdown: { category: string; amount: number }[];
  expenses: LedgerRow[];
  sales: LedgerRow[];
  expenditures: LedgerRow[];
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const allTime: MonthRow = {
    month: "All time",
    membershipRevenue: monthly.reduce((s, m) => s + m.membershipRevenue, 0),
    cafeteriaRevenue: monthly.reduce((s, m) => s + m.cafeteriaRevenue, 0),
    cafeteriaExpense: monthly.reduce((s, m) => s + m.cafeteriaExpense, 0),
    expenditure: monthly.reduce((s, m) => s + m.expenditure, 0),
  };

  const summary = selectedIdx !== null ? monthly[selectedIdx] : allTime;
  const totalIncome = summary.membershipRevenue + summary.cafeteriaRevenue;
  const net = totalIncome - summary.cafeteriaExpense - summary.expenditure;

  return (
    <div>
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
          {monthly.length > 0 && (
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-ink-text/5 p-1 w-fit max-w-full">
              <button
                onClick={() => setSelectedIdx(null)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  selectedIdx === null
                    ? "bg-white text-ink-text shadow-sm"
                    : "text-ink-text/50 hover:text-ink-text"
                }`}
              >
                All time
              </button>
              {monthly.map((m, i) => (
                <button
                  key={i}
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
            <RevenueChart data={monthly} />
            <ExpenseBreakdownChart data={expenseBreakdown} />
          </div>
        </div>
      )}

      {tab === "Cafeteria" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <LedgerTable
            title="Café sales"
            description="Daily counter sales income"
            rows={sales}
            kind="sale"
            amountClassName="text-sage"
            amountPrefix="+ ₹"
          />
          <LedgerTable
            title="Café & operating expenses"
            description="Groceries, utilities, staff, and more"
            rows={expenses}
            kind="expense"
            categories={EXPENSE_CATEGORIES}
            amountClassName="text-terracotta"
            amountPrefix="- ₹"
          />
        </div>
      )}

      {tab === "Expenditures" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <LedgerTable
            title="Expenditures"
            description="Furniture, equipment, renovations, branding, and capital spends"
            rows={expenditures}
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
                ₹{expenditures.reduce((s, r) => s + r.amount, 0).toLocaleString("en-IN")}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
