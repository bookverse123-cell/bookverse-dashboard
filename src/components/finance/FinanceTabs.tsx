"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { RevenueChart } from "./RevenueChart";
import { ExpenseBreakdownChart } from "./ExpenseBreakdownChart";
import { LedgerTable } from "./LedgerTable";
import { CafeteriaAnalyticsCard } from "./CafeteriaAnalyticsCard";
import { MembershipAnalyticsCard } from "./MembershipAnalyticsCard";
import type { LedgerRow, LockerAllocationFinanceRow, MembershipMonthRow, MembershipPaymentRow } from "@/lib/types";

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

const OVERALL_KEY = "__overall__";
const FUTURE_CARDS_END_KEY = "2027-06";
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}

function periodLabel(monthKey: string): string {
  const [y, mo] = monthKey.split("-").map(Number);
  const startDate = new Date(y, mo - 1, 15);
  const nextMo = mo === 12 ? 1 : mo + 1;
  const nextYr = mo === 12 ? y + 1 : y;
  const endDate = new Date(nextYr, nextMo - 1, 14);
  const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmtDate(startDate)} – ${fmtDate(endDate)}`;
}

function periodShortLabel(monthKey: string): string {
  const [y, mo] = monthKey.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function monthLabel(monthKey: string): string {
  const [y, mo] = monthKey.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function dateToBillingKey(dateStr: string): string {
  const parts = dateStr.slice(0, 10).split("-");
  let year = Number(parts[0]);
  let month = Number(parts[1]);
  const day = Number(parts[2]);
  if (day < 15) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

function addMonthsToKey(key: string, monthsToAdd: number): string {
  const [y, mo] = key.split("-").map(Number);
  const date = new Date(y, mo - 1 + monthsToAdd, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function zeroMembershipMonth(key: string): MembershipMonthRow {
  return {
    monthKey: key,
    month: periodShortLabel(key),
    assignedRevenue: 0,
    unassignedRevenue: 0,
    dailyPassRevenue: 0,
  };
}

function filterRowsByCycle<T extends { date: string }>(rows: T[], activeKey: string): T[] {
  if (activeKey === OVERALL_KEY) return rows;
  return rows.filter((row) => dateToBillingKey(row.date) === activeKey);
}

export function FinanceTabs({
  monthly,
  expenses,
  sales,
  expenditures,
  membershipMonthly,
  membershipPayments,
  lockerAllocations,
}: {
  monthly: MonthRow[];
  expenses: LedgerRow[];
  sales: LedgerRow[];
  expenditures: LedgerRow[];
  membershipMonthly: MembershipMonthRow[];
  membershipPayments: MembershipPaymentRow[];
  lockerAllocations: LockerAllocationFinanceRow[];
}) {
  const [activeKey, setActiveKey] = useState<string>(OVERALL_KEY);
  const [screen, setScreen] = useState<"hero" | "details">("hero");
  const [detailsTab, setDetailsTab] = useState<"finance" | "graphs" | "ledger">("finance");

  function openCycleDetails(key: string) {
    setActiveKey(key);
    setDetailsTab("finance");
    setScreen("details");
  }

  function backToHero() {
    setScreen("hero");
  }

  const dataKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const m of monthly) {
      if (m.monthKey) keys.add(m.monthKey);
    }
    for (const m of membershipMonthly) {
      keys.add(m.monthKey);
    }
    for (const row of expenses) keys.add(dateToBillingKey(row.date));
    for (const row of sales) keys.add(dateToBillingKey(row.date));
    for (const row of expenditures) keys.add(dateToBillingKey(row.date));
    for (const row of membershipPayments) keys.add(dateToBillingKey(row.date));
    for (const row of lockerAllocations) keys.add(dateToBillingKey(row.date));

    return Array.from(keys).sort();
  }, [monthly, membershipMonthly, expenses, sales, expenditures, membershipPayments, lockerAllocations]);

  const cycleCards = useMemo(() => {
    if (dataKeys.length === 0) {
      return [
        {
          key: OVERALL_KEY,
          label: "Overall",
          subtitle: "All-time",
          description: "Open complete finance summary across all months.",
          disabled: false,
        },
      ];
    }

    const cards: { key: string; label: string; subtitle: string; description: string; disabled: boolean }[] = [
      {
        key: OVERALL_KEY,
        label: "Overall",
        subtitle: "All-time",
        description: "Open complete finance summary across all months.",
        disabled: false,
      },
      ...dataKeys.map((key) => ({
        key,
        label: periodShortLabel(key),
        subtitle: periodLabel(key),
        description: "Open full details for this billing cycle.",
        disabled: false,
      })),
    ];

    const lastKnownKey = dataKeys[dataKeys.length - 1];
    let index = 1;
    while (true) {
      const futureKey = addMonthsToKey(lastKnownKey, index);
      if (futureKey > FUTURE_CARDS_END_KEY) break;
      cards.push({
        key: futureKey,
        label: periodShortLabel(futureKey),
        subtitle: "Upcoming",
        description: "Future billing cycle. Data will appear after activity.",
        disabled: true,
      });
      index += 1;
    }

    return cards;
  }, [dataKeys]);

  const cycleCardByKey = useMemo(() => {
    const map = new Map<string, { key: string; label: string; subtitle: string; description: string; disabled: boolean }>();
    for (const card of cycleCards) {
      if (card.key === OVERALL_KEY) continue;
      map.set(card.key, card);
    }
    return map;
  }, [cycleCards]);

  const calendarMonthKeys = useMemo(() => Array.from(cycleCardByKey.keys()).sort(), [cycleCardByKey]);

  const selectedLabel = activeKey === OVERALL_KEY ? "All-time" : periodLabel(activeKey);

  const filteredMonthly = useMemo(() => {
    if (activeKey === OVERALL_KEY) return monthly;
    const row = monthly.find((item) => item.monthKey === activeKey);
    if (row) return [row];
    return [
      {
        monthKey: activeKey,
        month: periodShortLabel(activeKey),
        membershipRevenue: 0,
        lockerRevenue: 0,
        cafeteriaRevenue: 0,
        cafeteriaExpense: 0,
        expenditure: 0,
      },
    ];
  }, [monthly, activeKey]);

  const filteredExpenses = useMemo(() => filterRowsByCycle(expenses, activeKey), [expenses, activeKey]);
  const filteredSales = useMemo(() => filterRowsByCycle(sales, activeKey), [sales, activeKey]);
  const filteredExpenditures = useMemo(() => filterRowsByCycle(expenditures, activeKey), [expenditures, activeKey]);
  const filteredMembershipPayments = useMemo(
    () => filterRowsByCycle(membershipPayments, activeKey),
    [membershipPayments, activeKey]
  );
  const filteredLockerAllocations = useMemo(
    () => filterRowsByCycle(lockerAllocations, activeKey),
    [lockerAllocations, activeKey]
  );

  const filteredMembershipMonthly = useMemo(() => {
    if (activeKey === OVERALL_KEY) return membershipMonthly;
    const row = membershipMonthly.find((item) => item.monthKey === activeKey);
    return row ? [row] : [zeroMembershipMonth(activeKey)];
  }, [membershipMonthly, activeKey]);

  const summary = useMemo(() => {
    const membershipRevenue = filteredMonthly.reduce((sum, row) => sum + row.membershipRevenue, 0);
    const lockerRevenue = filteredMonthly.reduce((sum, row) => sum + (row.lockerRevenue ?? 0), 0);
    const cafeteriaRevenue = filteredMonthly.reduce((sum, row) => sum + row.cafeteriaRevenue, 0);
    const cafeteriaExpense = filteredMonthly.reduce((sum, row) => sum + row.cafeteriaExpense, 0);
    const expenditure = filteredMonthly.reduce((sum, row) => sum + row.expenditure, 0);
    const totalIncome = membershipRevenue + lockerRevenue + cafeteriaRevenue;
    const net = totalIncome - cafeteriaExpense - expenditure;
    const margin = totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0;

    return {
      membershipRevenue,
      lockerRevenue,
      cafeteriaRevenue,
      totalIncome,
      cafeteriaExpense,
      expenditure,
      net,
      margin,
    };
  }, [filteredMonthly]);

  const overallSummary = useMemo(() => {
    const membershipRevenue = monthly.reduce((sum, row) => sum + row.membershipRevenue, 0);
    const lockerRevenue = monthly.reduce((sum, row) => sum + (row.lockerRevenue ?? 0), 0);
    const cafeteriaRevenue = monthly.reduce((sum, row) => sum + row.cafeteriaRevenue, 0);
    const cafeteriaExpense = monthly.reduce((sum, row) => sum + row.cafeteriaExpense, 0);
    const expenditure = monthly.reduce((sum, row) => sum + row.expenditure, 0);
    const totalIncome = membershipRevenue + lockerRevenue + cafeteriaRevenue;
    const totalExpense = cafeteriaExpense + expenditure;
    const net = totalIncome - totalExpense;
    return { totalIncome, totalExpense, net };
  }, [monthly]);

  const filteredExpenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of filteredExpenses) {
      const key = `Café · ${row.category}`;
      map.set(key, (map.get(key) ?? 0) + row.amount);
    }
    for (const row of filteredExpenditures) {
      const key = `Expenditure · ${row.category}`;
      map.set(key, (map.get(key) ?? 0) + row.amount);
    }
    return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
  }, [filteredExpenses, filteredExpenditures]);

  return (
    <div className="space-y-6">
      {screen === "hero" && (
        <>
          <div className="rounded-3xl border border-ink-line/10 bg-white/80 px-6 py-8 shadow-sm sm:px-8">
            <div className="mx-auto mb-6 flex w-fit items-center gap-3 rounded-full border border-ink-line/10 bg-white px-4 py-2">
              <Image src="/apple-touch-icon.png" alt="BookVerse logo" width={34} height={34} className="rounded-full" />
              <div className="text-left">
                <p className="text-xs font-mono uppercase tracking-wider text-ink-text/45">BookVerse Finance</p>
                <p className="text-sm font-semibold text-ink-text">Quick month verifier</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-sage/20 bg-sage/10 p-4">
                <p className="text-xs font-mono uppercase tracking-wider text-sage">Overall revenue</p>
                <p className="mt-1 text-xl font-semibold text-ink-text">{fmt(overallSummary.totalIncome)}</p>
              </div>
              <div className="rounded-xl border border-terracotta/20 bg-terracotta/8 p-4">
                <p className="text-xs font-mono uppercase tracking-wider text-terracotta">Overall expenses</p>
                <p className="mt-1 text-xl font-semibold text-ink-text">{fmt(overallSummary.totalExpense)}</p>
              </div>
              <div className="rounded-xl border border-brass/20 bg-brass/10 p-4">
                <p className="text-xs font-mono uppercase tracking-wider text-brass-soft">Overall net</p>
                <p className={`mt-1 text-xl font-semibold ${overallSummary.net >= 0 ? "text-sage" : "text-terracotta"}`}>
                  {overallSummary.net < 0 ? "−" : ""}
                  {fmt(overallSummary.net)}
                </p>
              </div>
              <div className="rounded-xl border border-ink-line/10 bg-white p-4">
                <p className="text-xs font-mono uppercase tracking-wider text-ink-text/45">Selected cycle</p>
                <p className="mt-1 text-xl font-semibold text-ink-text">{selectedLabel}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-line/10 bg-white/90 p-5 shadow-sm">
            <div className="mb-3">
              <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Billing cycle</p>
              <p className="mt-0.5 text-xs text-ink-text/45">Pick a month card to open that cycle. Use Overall for all-time totals.</p>
            </div>
            <div className="mb-4 rounded-xl border border-ink-line/10 bg-white p-3">
              {(() => {
                const overall = cycleCards.find((c) => c.key === OVERALL_KEY);
                if (!overall) return null;
                const isActive = activeKey === overall.key;
                return (
                  <motion.button
                    type="button"
                    onClick={() => openCycleDetails(overall.key)}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.99 }}
                    className={[
                      "w-full rounded-lg border px-4 py-4 text-left transition cursor-pointer",
                      isActive
                        ? "border-brass bg-brass text-white shadow-md"
                        : "border-ink-line/20 bg-gradient-to-r from-white to-brass/5 text-ink-text/75 hover:border-brass/40 hover:shadow-sm",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold">{overall.label}</p>
                        <p className={`mt-0.5 text-xs ${isActive ? "text-white/85" : "text-ink-text/50"}`}>{overall.description}</p>
                      </div>
                      <motion.div whileHover={{ rotate: -10, scale: 1.08 }}>
                        <CalendarDays size={17} className={isActive ? "text-white/95" : "text-brass-soft"} />
                      </motion.div>
                    </div>
                    <p className={`mt-3 text-[11px] font-medium ${isActive ? "text-white/90" : "text-ink-text/55"}`}>
                      Click anywhere on this card to open all-time details
                    </p>
                  </motion.button>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {calendarMonthKeys.map((monthKey) => {
                const [year, month] = monthKey.split("-").map(Number);
                const daysInMonth = new Date(year, month, 0).getDate();
                const firstDayIndex = new Date(year, month - 1, 1).getDay();
                const slots = Array.from({ length: firstDayIndex + daysInMonth }, (_, index) => index - firstDayIndex + 1);
                const cycleCard = cycleCardByKey.get(monthKey);
                const isActive = activeKey === monthKey;

                return (
                  <motion.button
                    key={monthKey}
                    type="button"
                    onClick={() => cycleCard && !cycleCard.disabled && openCycleDetails(cycleCard.key)}
                    disabled={!cycleCard || cycleCard.disabled}
                    whileHover={!cycleCard || cycleCard.disabled ? undefined : { scale: 1.02, y: -2 }}
                    whileTap={!cycleCard || cycleCard.disabled ? undefined : { scale: 0.99 }}
                    className={[
                      "rounded-xl border bg-white/85 p-2.5 text-left transition",
                      !cycleCard || cycleCard.disabled
                        ? "cursor-not-allowed border-ink-line/10 opacity-45"
                        : isActive
                          ? "cursor-pointer border-brass shadow-md"
                          : "cursor-pointer border-ink-line/10 hover:border-brass/40 hover:shadow-sm",
                    ].join(" ")}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink-text">{monthLabel(monthKey)}</p>
                      <CalendarDays size={14} className="text-ink-text/40" />
                    </div>

                    <div className="mb-1 grid grid-cols-7 gap-1">
                      {WEEKDAY_LABELS.map((day) => (
                        <div key={day} className="text-center text-[10px] font-mono uppercase tracking-wide text-ink-text/40">
                          {day.slice(0, 1)}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {slots.map((day, index) => {
                        if (day < 1) return <div key={`${monthKey}-blank-${index}`} className="h-8 rounded-md bg-transparent" />;

                        if (day === 15 && cycleCard) {
                          return (
                            <div
                              key={`${monthKey}-day-${day}`}
                              className={[
                                "h-8 rounded-md border text-left px-1 transition",
                                cycleCard.disabled
                                  ? "cursor-not-allowed border-ink-line/10 bg-ink-text/5 text-ink-text/30"
                                  : isActive
                                    ? "border-brass bg-brass text-white shadow-sm"
                                    : "border-sage/30 bg-sage/10 text-ink-text hover:border-brass/50 hover:bg-brass/10",
                              ].join(" ")}
                            >
                              <p className="text-[10px] font-semibold leading-tight">15</p>
                              <p className={`text-[9px] leading-tight ${isActive && !cycleCard.disabled ? "text-white/85" : "text-ink-text/55"}`}>
                                {cycleCard.disabled ? "Soon" : "Cycle"}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`${monthKey}-day-${day}`}
                            className="h-8 rounded-md border border-ink-line/10 bg-white/60 px-1 py-0.5 text-[10px] text-ink-text/40"
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-ink-text/50">Click card to open details</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {screen === "details" && (
        <>
          <div className="flex items-center justify-between rounded-2xl border border-ink-line/10 bg-white/90 px-4 py-3">
            <button
              type="button"
              onClick={backToHero}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-line/20 bg-white px-3 py-1.5 text-sm font-medium text-ink-text transition hover:bg-ink-text/5"
            >
              <ArrowLeft size={16} /> Back to hero
            </button>
            <p className="text-sm font-medium text-ink-text">Viewing: {selectedLabel}</p>
          </div>

          <div className="mb-1 flex gap-1 rounded-lg bg-ink-text/5 p-1 w-fit">
            <button
              type="button"
              onClick={() => setDetailsTab("finance")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                detailsTab === "finance"
                  ? "bg-white text-ink-text shadow-sm"
                  : "text-ink-text/55 hover:text-ink-text"
              }`}
            >
              Finance
            </button>
            <button
              type="button"
              onClick={() => setDetailsTab("graphs")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                detailsTab === "graphs"
                  ? "bg-white text-ink-text shadow-sm"
                  : "text-ink-text/55 hover:text-ink-text"
              }`}
            >
              Graphs
            </button>
            <button
              type="button"
              onClick={() => setDetailsTab("ledger")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                detailsTab === "ledger"
                  ? "bg-white text-ink-text shadow-sm"
                  : "text-ink-text/55 hover:text-ink-text"
              }`}
            >
              Payment Ledger
            </button>
          </div>

          {detailsTab === "finance" && (
            <>
              <motion.div
                key={activeKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6"
              >
                <h3 className="mb-4 font-display text-lg text-ink-text">Overview · {selectedLabel}</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Membership</p>
                    <p className="mt-1 text-xl font-medium text-ink-text">{fmt(summary.membershipRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Locker revenue</p>
                    <p className="mt-1 text-xl font-medium text-ink-text">{fmt(summary.lockerRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Cafeteria sales</p>
                    <p className="mt-1 text-xl font-medium text-ink-text">{fmt(summary.cafeteriaRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Operating expense</p>
                    <p className="mt-1 text-xl font-medium text-terracotta">{fmt(summary.cafeteriaExpense)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Expenditure</p>
                    <p className="mt-1 text-xl font-medium text-brass-soft">{fmt(summary.expenditure)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Profit margin</p>
                    <p className="mt-1 text-xl font-medium text-ink-text">{summary.margin}%</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-ink-text/40">Total (all income)</p>
                    <p className="mt-1 text-xl font-medium text-sage">{fmt(summary.totalIncome)}</p>
                  </div>
                </div>
              </motion.div>

              <MembershipAnalyticsCard
                monthly={filteredMembershipMonthly}
                payments={filteredMembershipPayments}
                lockerAllocations={filteredLockerAllocations}
                scopeLabel={selectedLabel}
                showSummary
                showLockerBreakup
                showChart={false}
                showLedger={false}
              />

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
                  <h3 className="font-display text-lg text-ink-text">Quick verification</h3>
                  <p className="mt-2 text-sm text-ink-text/60">This section reflects the selected cycle only.</p>
                  <p className="mt-3 text-sm text-ink-text/60">
                    Total expenditure in current scope:{" "}
                    <span className="font-medium text-ink-text">
                      ₹{filteredExpenditures.reduce((sum, row) => sum + row.amount, 0).toLocaleString("en-IN")}
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}

          {detailsTab === "graphs" && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <RevenueChart data={filteredMonthly} expenditures={filteredExpenditures} />
                <ExpenseBreakdownChart data={filteredExpenseBreakdown} />
              </div>

              <MembershipAnalyticsCard
                monthly={filteredMembershipMonthly}
                payments={filteredMembershipPayments}
                lockerAllocations={filteredLockerAllocations}
                scopeLabel={selectedLabel}
                showSummary={false}
                showLockerBreakup={false}
                showChart
                showLedger={false}
              />
            </>
          )}

          {detailsTab === "ledger" && (
            <MembershipAnalyticsCard
              monthly={filteredMembershipMonthly}
              payments={filteredMembershipPayments}
              lockerAllocations={filteredLockerAllocations}
              scopeLabel={selectedLabel}
              showSummary={false}
              showLockerBreakup={false}
              showChart={false}
              showLedger
            />
          )}
        </>
      )}
    </div>
  );
}
