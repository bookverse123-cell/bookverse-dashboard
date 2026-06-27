"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RevenueChart } from "./RevenueChart";
import { ExpenseBreakdownChart } from "./ExpenseBreakdownChart";
import { LedgerTable } from "./LedgerTable";
import type { LedgerRow } from "@/lib/demo-data";

const TABS = ["Overview", "Cafeteria", "Investments"] as const;
type Tab = (typeof TABS)[number];

const EXPENSE_CATEGORIES = ["Groceries & Snacks", "Utilities", "Maintenance", "Staff Wages", "Marketing", "Other"];
const INVESTMENT_CATEGORIES = ["Furniture", "Equipment", "Renovation", "Branding", "Technology", "Other"];

type MonthRow = {
  month: string;
  membershipRevenue: number;
  cafeteriaRevenue: number;
  cafeteriaExpense: number;
  investment: number;
};

export function FinanceTabs({
  monthly,
  expenseBreakdown,
  expenses,
  sales,
  investments,
}: {
  monthly: MonthRow[];
  expenseBreakdown: { category: string; amount: number }[];
  expenses: LedgerRow[];
  sales: LedgerRow[];
  investments: LedgerRow[];
}) {
  const [tab, setTab] = useState<Tab>("Overview");

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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RevenueChart data={monthly} />
          <ExpenseBreakdownChart data={expenseBreakdown} />
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

      {tab === "Investments" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <LedgerTable
            title="Investments & capital expenditure"
            description="Furniture, equipment, renovations, and branding"
            rows={investments}
            kind="investment"
            categories={INVESTMENT_CATEGORIES}
            amountClassName="text-brass-soft"
            amountPrefix="₹"
          />
          <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
            <h3 className="font-display text-lg text-ink-text">Why track this?</h3>
            <p className="mt-2 text-sm text-ink-text/60">
              Investments are excluded from monthly profit so a big furniture
              purchase doesn&apos;t make a good month look bad — but they&apos;re
              subtracted in the revenue vs. expenses chart on the Overview tab,
              so you can see their real impact on cash flow.
            </p>
            <p className="mt-3 text-sm text-ink-text/60">
              Total invested so far: <span className="font-medium text-ink-text">₹{investments.reduce((s, r) => s + r.amount, 0).toLocaleString("en-IN")}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
