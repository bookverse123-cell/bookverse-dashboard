"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { LedgerRow } from "@/lib/types";

const SALES_COLOR = "#7FA37A";
const EXPENSE_COLOR = "#DC2626";

function pct(value: number) {
  return `${Math.round(value)}%`;
}

export function CafeteriaAnalyticsCard({ sales, expenses }: { sales: LedgerRow[]; expenses: LedgerRow[] }) {
  const totalSales = sales.reduce((sum, row) => sum + row.amount, 0);
  const totalExpenses = expenses.reduce((sum, row) => sum + row.amount, 0);
  const net = totalSales - totalExpenses;

  const profitPercent = totalSales > 0 ? Math.max((net / totalSales) * 100, 0) : 0;
  const lossPercent = totalSales > 0 ? Math.max((-net / totalSales) * 100, 0) : 0;
  const expensePercent = totalSales > 0 ? (totalExpenses / totalSales) * 100 : 0;

  const pieData = [
    { name: "Sales", value: totalSales, color: SALES_COLOR },
    { name: "Expenses", value: totalExpenses, color: EXPENSE_COLOR },
  ].filter((item) => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6"
    >
      <div className="mb-4">
        <h3 className="font-display text-lg text-ink-text">Cafeteria analytics</h3>
        <p className="text-sm text-ink-text/50">Cafeteria only: sales vs expenses and profit/loss percentage</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-56 rounded-xl border border-parchment-line/70 bg-white/70 p-2 lg:col-span-1">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={74}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-text/40">
              No cafeteria entries yet.
            </div>
          )}
        </div>

        <div className="space-y-3 lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-sage/20 bg-sage/10 p-3">
              <p className="text-xs font-mono uppercase tracking-wider text-sage">Sales</p>
              <p className="mt-1 text-lg font-medium text-ink-text">₹{totalSales.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border border-terracotta/20 bg-terracotta/10 p-3">
              <p className="text-xs font-mono uppercase tracking-wider text-terracotta">Expenses</p>
              <p className="mt-1 text-lg font-medium text-ink-text">₹{totalExpenses.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border border-sage/20 bg-sage/10 p-3">
              <p className="text-xs font-mono uppercase tracking-wider text-sage">Profit %</p>
              <p className="mt-1 text-lg font-medium text-ink-text">{pct(profitPercent)}</p>
            </div>
            <div className="rounded-xl border border-terracotta/20 bg-terracotta/10 p-3">
              <p className="text-xs font-mono uppercase tracking-wider text-terracotta">Loss %</p>
              <p className="mt-1 text-lg font-medium text-ink-text">{pct(lossPercent)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-ink-line/10 bg-white/70 p-3 text-sm text-ink-text/65">
            <span className="font-medium text-ink-text">Cafeteria net:</span>{" "}
            <span className={net >= 0 ? "text-sage" : "text-terracotta"}>
              {net >= 0 ? "+ " : "− "}₹{Math.abs(net).toLocaleString("en-IN")}
            </span>
            <span className="ml-2 text-ink-text/40">(Expense ratio: {pct(expensePercent)})</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2 text-ink-text/70">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SALES_COLOR }} />
              Sales
            </div>
            <div className="flex items-center gap-2 text-ink-text/70">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: EXPENSE_COLOR }} />
              Expenses
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
