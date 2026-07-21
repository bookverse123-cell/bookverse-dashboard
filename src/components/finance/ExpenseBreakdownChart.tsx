"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { motion } from "framer-motion";

const CAFE_COLOR = "#C56B52";
const EXPENDITURE_COLOR = "#DC2626";

function getColor(category: string) {
  if (category.startsWith("Expenditure ·")) return EXPENDITURE_COLOR;
  return CAFE_COLOR;
}

export function ExpenseBreakdownChart({ data }: { data: { category: string; amount: number }[] }) {
  const chartData = [...data].sort((a, b) => b.amount - a.amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6"
    >
      <h3 className="font-display text-lg text-ink-text">Expenses by category</h3>
      <p className="mb-4 text-sm text-ink-text/50">Where café costs and expenditures are going</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#28365C" strokeOpacity={0.08} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: "#8C96AC" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: "#8C96AC" }} axisLine={false} tickLine={false} width={140} />
            <Tooltip
              contentStyle={{ background: "#10192B", border: "none", borderRadius: 12, color: "#F7F2E7", fontSize: 13 }}
              formatter={(value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`}
            />
            <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={18}>
              {chartData.map((entry) => (
                <Cell key={entry.category} fill={getColor(entry.category)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
