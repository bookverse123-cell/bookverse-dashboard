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
            <Bar dataKey="Revenue" fill="#7FA37A" radius={[6, 6, 0, 0]} barSize={18} />
            <Bar dataKey="Expenses" fill="#C56B52" radius={[6, 6, 0, 0]} barSize={18} />
            <Line type="monotone" dataKey="Profit" stroke="#D4A857" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
