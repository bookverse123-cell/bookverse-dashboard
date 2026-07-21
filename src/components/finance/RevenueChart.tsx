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

type MonthRow = {
  month: string;
  membershipRevenue: number;
  cafeteriaRevenue: number;
  cafeteriaExpense: number;
  expenditure: number;
};

export function RevenueChart({ data }: { data: MonthRow[] }) {
  const chartData = data.map((d) => ({
    month: d.month,
    Revenue: d.membershipRevenue + d.cafeteriaRevenue,
    Expenses: d.cafeteriaExpense,
    Expenditures: d.expenditure,
    Profit: d.membershipRevenue + d.cafeteriaRevenue - d.cafeteriaExpense - d.expenditure,
  }));

  const maxBarValue = chartData.reduce(
    (max, row) => Math.max(max, row.Revenue, row.Expenses, row.Expenditures),
    0
  );
  const minProfit = chartData.reduce((min, row) => Math.min(min, row.Profit), 0);
  const maxProfit = chartData.reduce((max, row) => Math.max(max, row.Profit), 0);
  const barCeiling = maxBarValue > 0 ? Math.ceil((maxBarValue * 1.15) / 1000) * 1000 : 10000;
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
              domain={[0, barCeiling]}
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
            <Bar yAxisId="amount" dataKey="Expenses" fill="#C56B52" radius={[6, 6, 0, 0]} barSize={16} />
            <Bar yAxisId="amount" dataKey="Expenditures" fill="#DC2626" radius={[6, 6, 0, 0]} barSize={16} />
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
