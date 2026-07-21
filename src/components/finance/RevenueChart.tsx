"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { LedgerRow } from "@/lib/types";

type MonthRow = {
  monthKey?: string;
  month: string;
  membershipRevenue: number;
  cafeteriaRevenue: number;
  cafeteriaExpense: number;
  expenditure: number;
};

type ExpenditureFilter = "all" | "cash" | "upi" | "cash_upi";

const FILTER_OPTIONS: { value: ExpenditureFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "cash_upi", label: "Cash + UPI" },
];

export function RevenueChart({ data, expenditures = [] }: { data: MonthRow[]; expenditures?: LedgerRow[] }) {
  const [filter, setFilter] = useState<ExpenditureFilter>("all");

  const filteredExpenditureByMonth = useMemo(() => {
    const map = new Map<string, number>();
    const filteredRows =
      filter === "all"
        ? expenditures
        : expenditures.filter((row) => row.payment_method === filter);

    for (const row of filteredRows) {
      const monthKey = row.date.slice(0, 7);
      map.set(monthKey, (map.get(monthKey) ?? 0) + row.amount);
    }

    return map;
  }, [expenditures, filter]);

  const chartData = data.map((d, index) => {
    const monthKey = d.monthKey ?? `${d.month}-${index}`;
    const filteredExpenditure =
      filter === "all" ? d.expenditure : (filteredExpenditureByMonth.get(monthKey) ?? 0);

    return {
      month: d.month,
      Revenue: d.membershipRevenue + d.cafeteriaRevenue,
      Expenditures: filteredExpenditure,
      CafeProfit: d.cafeteriaRevenue - d.cafeteriaExpense,
      Profit: d.membershipRevenue + d.cafeteriaRevenue - d.cafeteriaExpense - filteredExpenditure,
    };
  });

  const maxBarValue = chartData.reduce((max, row) => {
    return Math.max(max, row.Revenue, row.Expenditures, row.CafeProfit);
  }, 0);
  const minBarValue = chartData.reduce((min, row) => {
    return Math.min(min, row.Revenue, row.Expenditures, row.CafeProfit);
  }, 0);
  const minProfit = chartData.reduce((min, row) => Math.min(min, row.Profit), 0);
  const maxProfit = chartData.reduce((max, row) => Math.max(max, row.Profit), 0);
  const barCeiling = maxBarValue > 0 ? Math.ceil((maxBarValue * 1.15) / 1000) * 1000 : 10000;
  const barFloor = minBarValue < 0 ? Math.floor((minBarValue * 1.15) / 1000) * 1000 : 0;
  const profitPadding = Math.max(10000, Math.ceil(Math.max(Math.abs(minProfit), Math.abs(maxProfit)) * 0.15));
  const profitFloor = Math.floor((minProfit - profitPadding) / 1000) * 1000;
  const profitCeiling = Math.ceil((maxProfit + profitPadding) / 1000) * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-ink-text">Revenue vs. expenses</h3>
          <p className="text-sm text-ink-text/50">Membership + café income against operating costs and expenditures</p>
        </div>
        {expenditures.length > 0 && (
          <div className="flex gap-1 rounded-lg bg-ink-text/5 p-1">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  filter === option.value
                    ? "bg-white text-ink-text shadow-sm"
                    : "text-ink-text/50 hover:text-ink-text"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#28365C" strokeOpacity={0.08} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8C96AC" }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="amount"
              tick={{ fontSize: 12, fill: "#8C96AC" }}
              axisLine={false}
              tickLine={false}
              domain={[barFloor, barCeiling]}
              tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
            />
            <YAxis
              yAxisId="profit"
              orientation="right"
              tick={{ fontSize: 12, fill: "#B39C6A" }}
              axisLine={false}
              tickLine={false}
              domain={[profitFloor, profitCeiling]}
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
            <Bar yAxisId="amount" dataKey="Revenue" fill="#7FA37A" radius={[6, 6, 0, 0]} barSize={16} />
            <Bar yAxisId="amount" dataKey="Expenditures" fill="#DC2626" radius={[6, 6, 0, 0]} barSize={16} />
            <Bar yAxisId="amount" dataKey="CafeProfit" name="Cafeteria profit" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={16} />
            <Line
              yAxisId="profit"
              type="linear"
              dataKey="Profit"
              stroke="#D4A857"
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: "#F7F2E7" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
